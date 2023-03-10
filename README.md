# vite-learning-history

### 定义
[Vite](https://cn.vitejs.dev/)是一种新型前端构建工具，能够显著提升前端开发体验。它主要由两部分组成：
- 一个开发服务器，它基于`原生 ES模块`提供了丰富的内建功能，如速度快到惊人的 `模块热更新`（HMR）。
- 一套构建指令，它使用`Rollup`打包你的代码，并且它是预配置的，可输出用于生产环境的高度优化过的静态资源

#### 特点：
- 💡极速的服务启动 -- 使用原生 ESM 文件，无需打包

传统打包器更多的是抓取整体应用进行编译，vite是怎么改进开发服务器启动时间的。
1. 依赖：用esbuild预构建依赖，esbuild使用go语言编写，构建速度快10-100倍
2. 源码：非js文件需要被转换，vite使用`原生ESM`提供源码，这实际上是让浏览器接管了打包程序的部分工作：Vite 只需要在浏览器请求源码时进行转换并按需提供源码。根据情景动态导入代码，即只在当前屏幕上实际使用时才会被处理


- ⚡️轻量快速的热重载 -- 无论应用程序大小如何，都始终极快的模块热替换(HMR)

打包器随着应用体积增大，更新重建速度越来越慢，不管是开启了HMR的应用，始终被拖累。
在 Vite 中，HMR 是在原生 ESM 上执行的。当编辑一个文件时,Vite 只需要精确地使已编辑的模块与其最近的 HMR 边界之间的链失活[1]（大多数时候只是模块本身）,使得无论应用大小如何,HMR 始终能保持快速更新；利用http请求加速重载,比如cache-control强缓存依赖,利用`304 not modified`协商缓存,加快单个页面的更新速度,不需要再次重复请求

- 🛠️丰富的功能 -- 对 TypeScript、JSX、CSS 等支持开箱即用
- 📦优化的构建 -- 可选 “多页应用” 或 “库” 模式的预配置 Rollup 构建
- 🔩通用的插件 -- 在开发和构建之间共享 Rollup-superset 插件接口
- 🔑完全类化的api -- 灵活的 API 和完整的 TypeScript 类型

#### 功能
1. 依赖解析和预构建 -- 开发模式使用,Vite 的开发服务器将所有代码视为原生 ES 模块

  ```js
  import { someMethod } from 'my-dep'
  ```
  不使用打包器，上面的代码会在浏览器中抛出一个错误。Vite 将会检测到所有被加载的源文件中的此类裸模块导入，并执行以下操作:
  - vite找到对应依赖，用`esbuild`(对js语法处理的库)将其他规范（commonjs、UMD）的代码转换成`esmodule`,然后放到当前目录下的`node_modules/vite/deps`
  - 重写导入为合法的 URL，例如 /node_modules/.vite/deps/my-dep.js?v=f3sf2ebd 以便浏览器能够正确导入它们
  **依赖预构建目的**
  - CommonJS 或 UMD 发布的依赖项使用esbuild转换为 ESM
  - 放在可以直接使用的路径`.vite/deps`,方便路径重写导入
  - 解决网络多包传输的性能问题（比如一个依赖引用多个依赖，网络需要多次请求）,vite会将这些依赖集成为一个文件，减少网络请求

1. HMR



#### 扩展：
1. 构建工具是什么，做了哪些工作?
  常用的项目需要做,浏览器只识别js,html,css三种原始语法：
  - 将ts转换为js
  - vue：安装vue-complier，将jsx或.vue转换为render函数
  - less/sass: 对应loader工具
  - 语法降级：babel,新语法降级成旧版浏览器能识别的语法
  - 体积优化：uglifyjs - 压缩
  - ...

  需要工具把以上这些功能集成在一起处理，我们只关心对应的业务代码，每次改变对应内容，工具去执行以上的工作
  **构建工具工作事项**：
  - 模块化开发支持：直接从node_modules引入代码 + 多模块化支持
  - 处理代码兼容：集成对应处理工具
  - 提高项目性能：压缩，分割
  - 优化开发体验：HMR
  - 开发服务器：跨域
  - ...

  构建工具让我们不用关心代码在浏览器如何运行，我们只需要首次给构建工具提供一个配置文件(非必须，有默认配置项)，有这个配置之后，我们就可以在下次需要更新的时候调用命令就好，如果在结合如更新，我们就更加不需要管任何事情，这就是构建工具做的事情，它让我们不用关心生产代码也不用关心代码如何在浏览器运行，只需要关心开发业务


2. vite和webpack的区别，优势?

  webpack问题：
   - 项目越大，webpack要处理的js越多，构建工具需要很长时间才能启动开发服务器

  webpack支持多种模块化(commonjs,esmodule),一开始必须要统一模块化代码，需要将所有依赖都读一遍，更多考虑的是兼容性
  ```js
  const lodash = require('lodash')
  import Vue from 'vue'

  // webpack转换结果
  const lodash = webpack_require('lodash')
  const Vue = webpack_require('vue')
  ```

  Vite利用了浏览器支持原生esmodule的优势，极大优化体验。


### 解决的问题

当我们开始构建越来越大型的应用时，需要处理的 JavaScript 代码量也呈指数级增长。包含数千个模块的大型项目相当普遍。基于 JavaScript 开发的工具就会开始遇到性能瓶颈：通常需要很长时间（甚至是几分钟！）才能启动开发服务器，即使使用模块热替换（HMR），文件修改后的效果也需要几秒钟才能在浏览器中反映出来。如此循环往复，迟钝的反馈会极大地影响开发者的开发效率和幸福感。

`Vite`旨在利用生态系统中的新进展解决上述问题：浏览器开始原生支持 ES 模块，且越来越多 JavaScript 工具使用编译型语言编写.



### 快速开始


1. 开始vite项目

```bash
pnpm create vite
```
实际全局安装`create-vite`即`vite`脚手架,快速生成主流框架基础模板,然后直接运行`create-vite` **bin**目录下的一个执行配置,了解`pnpm add vite`和`pnpm create vite`的区别,vite脚手架有最佳实践的配置

### 命令

```bash
vite # 启动开发服务器
vite build # 执行应用构建
vite preview # 构建完应用后，本地启一个静态服务器，预览构建产物
```



### 配置

#### vite.config
```js
export default defineConfig ({
  //
})
```

#### 环境变量
1. 实现
  使用第三方库`dotenv`读取配置文件`.env`,解析文件中的环境变量,注入进process对象,vite考虑和其他配置的冲突不会直接插入process,可以调用**loadEnv**方法手动确认env文件
  - root
  - envDir: 用来配置当前环境变量的文件地址


2. 补充
- 为什么vite.config.js可以书写esmodule的形式,因为vite在读取vite.config.js的时候node率先会将esmodule转换成commonjs,node即可识别
- 如果环境变量不是以`VITE`开始，不会在客户端暴露至import.meta.env，可以通过`envPrefix`手动更改前缀

### 插件介绍


### 支持
vite浏览器支持:
- Chrome >=87
- Firefox >=78
- Safari >=14
- Edge >=88