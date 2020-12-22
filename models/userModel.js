const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
    firstname: {
        type: String,
        required: [true, 'Vui lòng nhập tên']
    },
    lastname: {
        type: String,
        required: [true, 'Vui lòng nhập họ']
    },
    email: {
        type: String,
        required: [true, 'Vui lòng nhập email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Vui lòng nhập đúng định dạng email']
    },
    password: {
        type: String,
        required: [true, 'Vui lòng nhập mật khẩu'],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Vui lòng xác nhận mật khẩu'],
        validate: {
            validator: function(el) {
                return el === this.password;
            },
            message: 'Mật khẩu xác thực không chính xác'
        }
    }
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }

    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
})

userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
}

const User = mongoose.model('User', userSchema);

module.exports = User;