const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");
const errorHandler = require("../utils/errorResponse");
const crypto = require("crypto");
const {sendEmail} = require("../utils/sendEmail");

exports.register = async (req, res, next) => {
    const { username, email, password } = req.body;
    try {
        const user = await User.create({
            username, email, password
        });
        sendToken(user, 200, res);
    } catch (error) {
        next(error);
    }
};

exports.login = async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new ErrorResponse("please provide an email and password", 400));
    }
    try {
        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            return next(new ErrorResponse("invalid credentials", 401));
        }
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return next(new ErrorResponse("invalid credentials", 401));
        }
        sendToken(user, 200, res);
    } catch (error) {
        next(error);

    };

};

exports.forgotpassword = async (req, res, next) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return next(new ErrorResponse("user is not exist", 404))
        }
        const resetToken = user.getresetToken = user.getResetPasswordToken();
        await user.save();
        const resetUrl = `http:localhost:3000/passwordreset/${resetToken}`;
        const message = `<h1> you have requested a password reset </h1>
             <p>please go to this link to  reset your password </p>
             <a href=${resetUrl} clicktracking = off >${resetUrl} </a> `;
        try {
            await sendEmail({
                to: user.email,
                subject: "password reset request",
                text: message
            });
            res.status(200).json({
                success: true,
                data: "Email sent"
            });

        } catch (error) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
            return next(new ErrorResponse("email has not sent", 500));
        }
    } catch (error) {
        next(error);
    }
};

exports.resetpassword = async (req, res, next) => {
    const resetPasswordToken = crpto.createHash("sha256").update(req.param.resetToken).digest("hex");
    try {
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        })
        if (!user) {
            return next(new ErrorResponse("invalid reset token", 400))
        }
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
        res.status(201).json({ success: true, data: "password has been changed successfully" })
    } catch (error) {
        next(error);
    }
};

const sendToken = (user, statusCode, res) => {
    const token = user.getSignedToken();
    res.status(statusCode).json({ success: true, token })
};