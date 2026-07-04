const { supabaseAdmin } = require('../config/supabase');

// Register new user
exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phoneNumber, role } = req.body || {};

    // Validate input
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if user exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: false
    });

    if (authError) {
      return res.status(400).json({
        success: false,
        message: authError.message
      });
    }

    // Create user profile
    const { data: newUser, error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        role: role,
        is_active: true,
        is_verified: false
      })
      .select();

    if (profileError) {
      // Delete auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return res.status(400).json({
        success: false,
        message: profileError.message
      });
    }

    // Create role-specific profile
    if (role === 'patient') {
      await supabaseAdmin
        .from('patients')
        .insert({
          id: authUser.user.id,
          total_appointments: 0,
          total_spent: 0
        });
    } else if (role === 'doctor') {
      const { specialization, licenseNumber, yearsOfExperience, hospital, consultationFee, accountNumber, bankName, accountName } = req.body || {};

      if (!specialization || !licenseNumber || !consultationFee || !accountNumber || !bankName || !accountName) {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        await supabaseAdmin.from('users').delete().eq('id', authUser.user.id);
        
        return res.status(400).json({
          success: false,
          message: 'Doctor profile requires specialization, license number, consultation fee, account number, bank name, and account name'
        });
      }

      await supabaseAdmin
        .from('doctors')
        .insert({
          id: authUser.user.id,
          specialization,
          license_number: licenseNumber,
          years_of_experience: yearsOfExperience || 0,
          hospital: hospital || '',
          consultation_fee: parseFloat(consultationFee),
          account_number: accountNumber,
          bank_name: bankName,
          account_name: accountName,
          is_available: true
        });
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.',
      data: {
        userId: newUser[0].id,
        email: newUser[0].email,
        role: newUser[0].role
      }
    });
  } catch (error) {
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
        message: 'Please provide email and password'
      });
    }

    // Sign in with Supabase Auth
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name, role, is_active, is_verified')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch user profile'
      });
    }

    if (!userProfile.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userProfile,
        token: data.session.access_token,
        refreshToken: data.session.refresh_token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name, phone_number, role, is_active, is_verified, avatar_url, created_at')
      .eq('id', userId)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { firstName, lastName, phoneNumber, avatarUrl } = req.body || {};

    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update({
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        avatar_url: avatarUrl
      })
      .eq('id', userId)
      .select();

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    // Verify current password by attempting to sign in
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: user.email,
      password: currentPassword
    });

    if (signInError) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      return res.status(400).json({
        success: false,
        message: updateError.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
