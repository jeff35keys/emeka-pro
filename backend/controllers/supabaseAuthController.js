const { supabase, supabaseAdmin } = require('../config/supabase');
const { isValidEmail, isValidPassword } = require('../middleware/validationMiddleware');

const mapUser = (user) => ({
  ...user,
  _id: user.id,
  firstName: user.first_name,
  lastName: user.last_name,
  phoneNumber: user.phone_number,
  avatarUrl: user.avatar_url,
  isActive: user.is_active,
  isVerified: user.is_verified
});

const getNamePartsFromAuthUser = (authUser) => {
  const metadata = authUser?.user_metadata || {};
  const emailName = authUser?.email?.split('@')[0] || 'User';
  const firstName = metadata.firstName || metadata.first_name || emailName;
  const lastName = metadata.lastName || metadata.last_name || 'Account';

  return { firstName, lastName };
};

const createMissingUserProfile = async (authUser) => {
  const metadata = authUser?.user_metadata || {};
  const canCreateDoctor = metadata.role === 'doctor' && metadata.specialization && metadata.licenseNumber && metadata.consultationFee;
  const role = canCreateDoctor ? 'doctor' : metadata.role === 'admin' ? 'admin' : 'patient';
  const { firstName, lastName } = getNamePartsFromAuthUser(authUser);

  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .insert({
      id: authUser.id,
      email: authUser.email,
      first_name: firstName,
      last_name: lastName,
      phone_number: metadata.phoneNumber || metadata.phone_number || null,
      role,
      is_verified: Boolean(authUser.email_confirmed_at)
    })
    .select()
    .single();

  if (userError) throw userError;

  if (userData.role === 'patient') {
    const { error: patientError } = await supabaseAdmin
      .from('patients')
      .upsert({ id: authUser.id }, { onConflict: 'id' });

    if (patientError) throw patientError;
  }

  if (userData.role === 'doctor') {
    const { error: doctorError } = await supabaseAdmin
      .from('doctors')
      .upsert({
        id: authUser.id,
        license_number: metadata.licenseNumber,
        specialization: metadata.specialization,
        years_of_experience: metadata.yearsOfExperience || 0,
        hospital: metadata.hospital || null,
        consultation_fee: parseFloat(metadata.consultationFee),
        is_available: true
      }, { onConflict: 'id' });

    if (doctorError) throw doctorError;
  }

  return userData;
};

// Exportable helper for repairing users
exports.createMissingUserProfile = createMissingUserProfile;

// Admin endpoint to repair missing user profiles in database for all auth users
exports.repairMissingUsers = async (req, res) => {
  try {
    // Only admins should call this - middleware should enforce but double-check
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin role required' });
    }

    // List all auth users (may be paginated)
    const usersList = [];
    let page = 1;
    let fetched = 0;
    do {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 100, page });
      if (error) break;
      fetched = data?.users?.length || 0;
      if (fetched > 0) usersList.push(...data.users);
      page += 1;
    } while (fetched === 100);

    const repaired = [];
    for (const authUser of usersList) {
      try {
        // check if user exists in 'users' table
        const { data: existing, error: userError } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('id', authUser.id)
          .maybeSingle();

        if (!existing) {
          const created = await createMissingUserProfile(authUser);
          repaired.push({ id: authUser.id, createdId: created.id });
        }
      } catch (innerErr) {
        console.error('Repair user error for', authUser.id, innerErr.message || innerErr);
      }
    }

    res.status(200).json({ success: true, message: 'Repair completed', repairedCount: repaired.length, repaired });
  } catch (error) {
    console.error('Repair missing users error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Register new user
exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phoneNumber, role, dateOfBirth, gender, specialization, licenseNumber, yearsOfExperience, hospital, consultationFee, accountNumber, bankName, accountName } = req.body || {};
    const userRole = role || 'patient';

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, first name, and last name are required'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    if (!['patient', 'doctor', 'admin'].includes(userRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user role'
      });
    }

    if (userRole === 'doctor' && (!licenseNumber || !specialization || !consultationFee)) {
      return res.status(400).json({
        success: false,
        message: 'License number, specialization, and consultation fee required for doctors'
      });
    }

    // Register user with Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        firstName,
        lastName,
        phoneNumber: phoneNumber || null,
        role: userRole,
        specialization: specialization || null,
        licenseNumber: licenseNumber || null,
        yearsOfExperience: yearsOfExperience || null,
        hospital: hospital || null,
        consultationFee: consultationFee || null
      }
    });

    if (authError) {
      return res.status(400).json({
        success: false,
        message: authError.message
      });
    }

    const userId = authData.user.id;

    // Create user record in database
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber || null,
        role: userRole,
        is_verified: false
      })
      .select()
      .single();

    if (userError) {
      console.error('User record creation error:', userError);
      // Delete auth user if database insert fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return res.status(400).json({
        success: false,
        message: userError.message || 'Failed to create user record'
      });
    }

    // If registering as patient, create patient record
    if (userRole === 'patient') {
      const { error: patientError } = await supabaseAdmin
        .from('patients')
        .insert({
          id: userId,
          date_of_birth: dateOfBirth || null,
          gender: gender || null
        });

      if (patientError) {
        console.error('Patient creation error:', patientError);
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return res.status(400).json({
          success: false,
          message: patientError.message || 'Failed to create patient record'
        });
      }
    }

    // If registering as doctor, create doctor record
    if (userRole === 'doctor') {
      const { error: doctorError } = await supabaseAdmin
        .from('doctors')
        .insert({
          id: userId,
          license_number: licenseNumber,
          specialization,
          years_of_experience: yearsOfExperience || 0,
          hospital: hospital || null,
          consultation_fee: parseFloat(consultationFee),
          account_number: accountNumber || null,
          bank_name: bankName || null,
          account_name: accountName || null,
          is_available: true
        });

      if (doctorError) {
        console.error('Doctor creation error:', doctorError);
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return res.status(400).json({
          success: false,
          message: doctorError.message || 'Failed to create doctor record'
        });
      }
    }

    // Generate JWT token
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (sessionError || !sessionData?.session?.access_token) {
      return res.status(201).json({
        success: true,
        message: 'User registered successfully. Please log in to continue.',
        user: mapUser(userData),
        token: null,
        refreshToken: null,
        data: {
          user: mapUser(userData),
          token: null,
          refreshToken: null
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: mapUser(userData),
      token: sessionData?.session?.access_token,
      refreshToken: sessionData?.session?.refresh_token,
      data: {
        user: mapUser(userData),
        token: sessionData?.session?.access_token,
        refreshToken: sessionData?.session?.refresh_token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Get user role from database
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (userError) {
      if (userError.code === 'PGRST116') {
        try {
          const repairedUser = await createMissingUserProfile(data.user);

          return res.status(200).json({
            success: true,
            message: 'Login successful',
            user: mapUser(repairedUser),
            token: data.session.access_token,
            refreshToken: data.session.refresh_token,
            expiresIn: data.session.expires_in,
            data: {
              user: mapUser(repairedUser),
              token: data.session.access_token,
              refreshToken: data.session.refresh_token,
              expiresIn: data.session.expires_in
            }
          });
        } catch (repairError) {
          console.error('User profile repair error:', repairError);
        }
      }

      return res.status(400).json({
        success: false,
        message: 'User profile was not found. Please register again or contact support.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: mapUser(userData),
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
      data: {
        user: mapUser(userData),
        token: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get role-specific data
    let profileData = data;

    if (data.role === 'patient') {
      const { data: patientData } = await supabaseAdmin
        .from('patients')
        .select('*')
        .eq('id', userId)
        .single();

      profileData = { ...data, ...patientData };
    }

    if (data.role === 'doctor') {
      const { data: doctorData } = await supabaseAdmin
        .from('doctors')
        .select('*')
        .eq('id', userId)
        .single();

      profileData = { ...data, ...doctorData };
    }

    res.status(200).json({
      success: true,
      data: mapUser(profileData),
      user: mapUser(profileData)
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, phoneNumber, avatar_url, ...restData } = req.body || {};

    // Update user record
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .update({
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        avatar_url: avatar_url,
        updated_at: new Date()
      })
      .eq('id', userId)
      .select()
      .single();

    if (userError) {
      return res.status(400).json({
        success: false,
        message: userError.message
      });
    }

    // Update role-specific data
    if (userData.role === 'patient') {
      const { error: patientError } = await supabaseAdmin
        .from('patients')
        .update({
          ...restData,
          updated_at: new Date()
        })
        .eq('id', userId);

      if (patientError) {
        console.error('Patient update error:', patientError);
      }
    }

    if (userData.role === 'doctor') {
      const { error: doctorError } = await supabaseAdmin
        .from('doctors')
        .update({
          ...restData,
          updated_at: new Date()
        })
        .eq('id', userId);

      if (doctorError) {
        console.error('Doctor update error:', doctorError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: mapUser(userData),
      user: mapUser(userData)
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current and new passwords are required'
      });
    }

    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Update password with Supabase
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    await supabase.auth.signOut();

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body || {};

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        token: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
