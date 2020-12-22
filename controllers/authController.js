const jwt = require('jsonwebtoken');
const { promisify } = require('util');

const User = require('./../models/userModel');


exports.signup = async(req, res) => {
    try {
        const newUser = await User.create({
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            email: req.body.email,
            password: req.body.password,
            passwordConfirm: req.body.passwordConfirm
        });

        res.status(201).json({
            status: 'success',
            data: {
                user: newUser
            }
        });
    } catch (err) {
        res.status(404).json({
            status: 'fail',
            message: err
        });
    }
}

exports.login = async(req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            status: 'fail',
            message: 'Vui lòng nhập email và password'
        });
    }

    const user = await User.findOne({ email: email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
        return res.status(401).json({
            status: 'fail',
            message: 'Email hoặc mật khẩu không đúng'
        });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });

    res.cookie('jwt', token, {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true
    });

    user.password = undefined;

    res.status(200).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
}

exports.protect = async(req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            status: 'fail',
            message: 'Bạn chưa đăng nhập, vui lòng đăng nhập để truy cập'
        });
    }

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
        return res.status(401).json({
            status: 'fail',
            message: 'Người dùng thuộc về token này không tồn tại'
        });
    }

    req.user = currentUser;
    next();
}

exports.updatePassword = async(req, res) => {
    const { currentPassword, password, passwordConfirm } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    if (!(await user.correctPassword(currentPassword, user.password))) {
        return res.status(401).json({
            status: 'fail',
            message: 'Mật khẩu không đúng'
        });
    }

    user.password = password;
    user.passwordConfirm = passwordConfirm;

    await user.save();

    user.password = undefined;

    res.status(200).json({
        status: 'success',
        data: {
            user
        }
    })
}