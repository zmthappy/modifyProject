// //引入readline模块
// const readline = require('readline');
// //创建readline接口实例
// let r1 = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout
// });
// //注册line事件
// r1.on('line', function (line) {
//   switch (line.trim()) {
//     case 'copy':
//       console.log('复制');
//       break;
//     case 'hello':
//       r1.write('write');
//       console.log('world');
//       break;
//     case 'close':
//       r1.close();
//       break;
//     default:
//       console.log('没有找到命令');
//       break;
//   }
// });
// //close事件监听
// r1.on('close', function () {
//   console.log('----end----');
//   process.exit(0);
// });
var dayjs = require('dayjs')


console.log(typeof (dayjs().format('YYYY-MM-DD')));