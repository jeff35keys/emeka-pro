const { supabaseAdmin } = require('../config/supabase');

exports.createNotification = async ({ userId, title, message, type, relatedAppointmentId = null }) => {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .insert({
      user_id: userId,
      title,
      message,
      type,
      related_appointment_id: relatedAppointmentId,
      created_at: new Date()
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(200).json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(200).json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
