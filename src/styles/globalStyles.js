//Định nghĩa các kiểu chung sử dụng nhiều nơi.
//Tạo sự nhất quán về giao diện
//Khi thiết kế màn hình thì import vào xài luôn, đỡ phải viết lại nhiều lần.

import colors from './colors';
import fonts from './fonts';

export default {
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: colors.background,
  },
  header: {
    fontSize: fonts.sizeLarge,
    fontWeight: 'bold',
    color: colors.primary,
  },
  button: {
    padding: 10,
    backgroundColor: colors.primary,
    borderRadius: 5,
  },
};
