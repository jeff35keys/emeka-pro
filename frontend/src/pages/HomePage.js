import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/HomePage.css';

function HomePage() {
  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <h1>Book Doctor Appointments Online</h1>
          <p>Fast, reliable, and secure appointment scheduling for quality healthcare</p>
          <Link to="/doctors" className="cta-button">Find a Doctor</Link>
        </div>
      </section>

      <section className="features">
        <h2>Why Choose Us?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>24/7 Booking</h3>
            <p>Book appointments anytime, anywhere at your convenience</p>
          </div>
          <div className="feature-card">
            <h3>Expert Doctors</h3>
            <p>Access highly qualified and experienced healthcare professionals</p>
          </div>
          <div className="feature-card">
            <h3>Flexible Payments</h3>
            <p>Pay securely via bank transfer or cash</p>
          </div>
          <div className="feature-card">
            <h3>Secure & Private</h3>
            <p>Your medical data is encrypted and kept confidential</p>
          </div>
          <div className="feature-card">
            <h3>Mobile Friendly</h3>
            <p>Responsive design works perfectly on all devices</p>
          </div>
          <div className="feature-card">
            <h3>Reminders</h3>
            <p>Automated appointment reminders to reduce no-shows</p>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Register</h3>
            <p>Create your account with basic information</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Browse Doctors</h3>
            <p>Search doctors by specialization and availability</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Book Appointment</h3>
            <p>Select a convenient time slot and confirm</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Pay</h3>
            <p>Complete payment via your preferred method</p>
          </div>
          <div className="step">
            <div className="step-number">5</div>
            <h3>Attend</h3>
            <p>Show up for your appointment on the scheduled date</p>
          </div>
        </div>
      </section>

      <footer className="footer">
        <p>&copy; 2024 Doctor Appointment System. All rights reserved.</p>
        <p>Built for Ozoro Community Hospital</p>
      </footer>
    </div>
  );
}

export default HomePage;
