// Kiểm tra dữ liệu người dùng nhập vào. Xử lý validation cho form đăng nhập, đăng ký,...
export const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };
  
  export const validatePassword = (password) => {
    return password.length >= 6;
  };
  