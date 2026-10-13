require('dotenv').config();

const nodemailer = require('nodemailer');
const Users = require('../models/Users');
const ForgotPasswordRequests = require('../models/ForgotPasswordRequests');
const bcrypt = require("bcrypt");

const transporter = nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST,
    port: 587,
    secure: false,
    auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_KEY
    }
});

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: 'Email is required'
            });
        }

        const user = await Users.findOne({
            where: { email }
        });

        // Do not reveal whether the email is registered.
        if (!user) {
            return res.status(200).json({
                message: 'If the account exists, a reset link will be sent.'
            });
        }

        const request = await ForgotPasswordRequests.create({
            UserId: user.id,
            isactive: true
        });

        const resetUrl = `http://localhost:3000/password/resetpassword/${request.id}`;

        await transporter.sendMail({
            from: `"Expense Tracker" <${process.env.EMAIL_FROM}>`,
            to: email,
            subject: 'Reset your Expense Tracker password',
            text: `Open this link to reset your password: ${resetUrl}`,
            html: `
                <h2>Password Reset</h2>
                <p>Click below to reset your password.</p>
                <a href="${resetUrl}">Reset Password</a>
                <p>If you did not request this, ignore this email.</p>
            `
        });

        return res.status(200).json({
            message: 'If the account exists, a reset link will be sent.'
        });
    } catch (error) {
        console.error('Forgot password error:', error);

        return res.status(500).json({
            message: 'Unable to process the request.'
        });
    }
};


const showResetPasswordForm = async (req, res) => {
    try {
        const { id } = req.params;

        const request = await ForgotPasswordRequests.findOne({
            where: {
                id,
                isactive: true
            }
        });

        if (!request) {
            return res.status(400).send(
                'This password reset link is invalid or has already been used.'
            );
        }

        return res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport"
                      content="width=device-width, initial-scale=1.0">
                <title>Reset Password</title>
                <link
                    href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
                    rel="stylesheet">
            </head>
            <body class="bg-light">
                <div class="container d-flex justify-content-center
                            align-items-center min-vh-100">
                    <form method="POST"
                          action="/password/resetpassword/${encodeURIComponent(id)}"
                          class="card shadow p-4"
                          style="max-width: 400px; width: 100%;">
                        <h3 class="mb-4 text-center">Reset Password</h3>

                        <label for="password" class="form-label">
                            New Password
                        </label>
                        <input type="password"
                               id="password"
                               name="password"
                               class="form-control mb-3"
                               minlength="8"
                               required>

                        <label for="confirmPassword" class="form-label">
                            Confirm Password
                        </label>
                        <input type="password"
                               id="confirmPassword"
                               name="confirmPassword"
                               class="form-control mb-3"
                               minlength="8"
                               required>

                        <button class="btn btn-primary w-100" type="submit">
                            Update Password
                        </button>
                    </form>
                </div>

                <script>
                    const form = document.querySelector('form');
                    form.addEventListener('submit', function(event) {
                        const password =
                            document.getElementById('password').value;
                        const confirmPassword =
                            document.getElementById('confirmPassword').value;

                        if (password !== confirmPassword) {
                            event.preventDefault();
                            alert('Passwords do not match.');
                        }
                    });
                </script>
            </body>
            </html>
        `);
    } catch (error) {
        console.error(error);
        return res.status(500).send('Something went wrong.');
    }
};

const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    // Validate the new password
    if (!password) {
      return res.status(400).json({
        message: "Password is required",
      });
    }

    // Find an active reset request
    const resetRequest = await ForgotPasswordRequests.findOne({
      where: {
        id,
        isactive: true,
      },
    });

    if (!resetRequest) {
      return res.status(400).json({
        message: "Invalid or expired reset link",
      });
    }

    // Find the associated user
    const user = await Users.findByPk(resetRequest.UserId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Hash the password using the same method as signup
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password
    await user.update({
      password: hashedPassword,
    });

    // Deactivate the reset link after successful password update
    await resetRequest.update({
      isactive: false,
    });

    return res.status(200).json({
      message: "Password reset successful",
    });
  } catch (err) {
    console.error("Reset password error:", err);

    return res.status(500).json({
      message: "Failed to reset password",
    });
  }
};


module.exports = { 
    forgotPassword,
    showResetPasswordForm,
    resetPassword 
};