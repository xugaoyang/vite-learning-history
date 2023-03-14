# vite-learning-history

### 介绍

[Vite](https://cn.vitejs.dev/)是一种新型前端构建工具，能够显著提升前端开发体验。它主要由两部分组成：

- 一个开发服务器，它基于`原生 ES模块`提供了丰富的内建功能，如速度快到惊人的 `模块热更新`（HMR）。
- 一套构建指令，它使用`Rollup`打包你的代码，并且它是预配置的，可输出用于生产环境的高度优化过的静态资源

#### 特点：

- 💡 极速的服务启动 -- 使用原生 ESM 文件，无需打包

  传统打包器更多的是抓取整体应用进行编译，vite 是怎么改进开发服务器启动时间的。

  1. 依赖：用 esbuild 预构建依赖，esbuild 使用 go 语言编写，构建速度快 10-100 倍
  2. 源码：非 js 文件需要被转换，vite 使用`原生ESM`提供源码，这实际上是让浏览器接管了打包程序的部分工作：Vite 只需要在浏览器请求源码时进行转换并按需提供源码。根据情景动态导入代码，即只在当前屏幕上实际使用时才会被处理

- ⚡️ 轻量快速的热重载 -- 无论应用程序大小如何，都始终极快的模块热替换(HMR)

  打包器随着应用体积增大，更新重建速度越来越慢，不管是开启了 HMR 的应用，始终被拖累。
  在 Vite 中，HMR 是在原生 ESM 上执行的。当编辑一个文件时,Vite 只需要精确地使已编辑的模块与其最近的 HMR 边界之间的链失活[1]（大多数时候只是模块本身）,使得无论应用大小如何,HMR 始终能保持快速更新；利用 http 请求加速重载,比如 cache-control 强缓存依赖,利用`304 not modified`协商缓存,加快单个页面的更新速度,不需要再次重复请求

- 🛠️ 丰富的功能 -- 对 TypeScript、JSX、CSS 等支持开箱即用
- 📦 优化的构建 -- 可选 “多页应用” 或 “库” 模式的预配置 Rollup 构建
- 🔩 通用的插件 -- 在开发和构建之间共享 Rollup-superset 插件接口
- 🔑 完全类化的 api -- 灵活的 API 和完整的 TypeScript 类型

#### 功能

1. 依赖解析和预构建 -- 开发模式使用,Vite 的开发服务器将所有代码视为原生 ES 模块

```js
import { someMethod } from 'my-dep'
```

不使用打包器，上面的代码会在浏览器中抛出一个错误。Vite 将会检测到所有被加载的源文件中的此类裸模块导入，并执行以下操作:

- vite 找到对应依赖，用`esbuild`(对 js 语法处理的库)将其他规范（commonjs、UMD）的代码转换成`esmodule`,然后放到当前目录下的`node_modules/vite/deps`
- 重写导入为合法的 URL，例如 /node_modules/.vite/deps/my-dep.js?v=f3sf2ebd 以便浏览器能够正确导入它们

依赖预构建目的
- CommonJS 或 UMD 发布的依赖项使用 esbuild 转换为 ESM
- 放在可以直接使用的路径`.vite/deps`,方便路径重写导入
- 解决网络多包传输的性能问题（比如一个依赖引用多个依赖，网络需要多次请求）,vite 会将这些依赖集成为一个文件，减少网络请求

2. HMR

参考：[vite 中的 HMR](https://zhuanlan.zhihu.com/p/402162720)

HMR(Hot Module Replacement):模块热替换.

`Vite`内置了`HMR`功能,当我们在开发模式启动应用时,打开开发者工具的网络面板,可以看到一个ws链接,这个ws链接就是 HMR 用来传递更新信息的通道.查看请求到的`html`源码,会看到head中被注入了一行代码
```html
<script type="module" src="/@vite/client"></script>
```
`/@vite/client`脚本实现了`HMR`客户端的逻辑，也就是ws链接的响应处理函数

![@vite/client源码](https://github.com/xugaoyang/vite-learning-history/blob/main/images/vite_client.jpg?raw=true)

可以看到,ws中会处理多种类型的事件.Vite 在更新模块时用到最多的是full-reload和update两个事件.前者用来刷新整个页面,也即执行location.reload()函数,后者会重新动态加载热更新的模块.

![vite_ws](https://github.com/xugaoyang/vite-learning-history/blob/main/images/vite_ws.jpg?raw=true)

代码变更后，ws能看到触发了type:update的事件.实际内部的操作不做过多解释.

#### 扩展：

##### 构建工具是什么，做了哪些工作?

常用的项目需要做,浏览器只识别 js,html,css 三种原始语法：
  - 将 ts 转换为 js
  - vue：安装 vue-complier，将 jsx 或.vue 转换为 render 函数
  - less/sass: 对应 loader 工具
  - 语法降级：babel,新语法降级成旧版浏览器能识别的语法
  - 体积优化：uglifyjs - 压缩
  - ...

需要工具把以上这些功能集成在一起处理，我们只关心对应的业务代码，每次改变对应内容，工具去执行以上的工作

构建工具工作事项：
- 模块化开发支持：直接从 node_modules 引入代码 + 多模块化支持
- 处理代码兼容：集成对应处理工具
- 提高项目性能：压缩，分割
- 优化开发体验：HMR
- 开发服务器：跨域
- ...

构建工具让我们不用关心代码在浏览器如何运行，我们只需要首次给构建工具提供一个配置文件(非必须，有默认配置项)，有这个配置之后，我们就可以在下次需要更新的时候调用命令就好，如果在结合如更新，我们就更加不需要管任何事情，这就是构建工具做的事情，它让我们不用关心生产代码也不用关心代码如何在浏览器运行，只需要关心开发业务

##### vite 和 webpack 的区别，优势?

webpack 问题：项目越大，webpack 要处理的 js 越多，构建工具需要很长时间才能启动开发服务器

webpack 支持多种模块化(commonjs,esmodule),一开始必须要统一模块化代码，需要将所有依赖都读一遍，更多考虑的是兼容性

```js
const lodash = require('lodash')
import Vue from 'vue'

// webpack转换结果
const lodash = webpack_require('lodash')
const Vue = webpack_require('vue')
```

Vite 利用了浏览器支持原生 esmodule 的优势，极大优化体验。

### 解决的问题

当我们开始构建越来越大型的应用时，需要处理的 JavaScript 代码量也呈指数级增长。包含数千个模块的大型项目相当普遍。基于 JavaScript 开发的工具就会开始遇到性能瓶颈：通常需要很长时间（甚至是几分钟！）才能启动开发服务器，即使使用模块热替换（HMR），文件修改后的效果也需要几秒钟才能在浏览器中反映出来。如此循环往复，迟钝的反馈会极大地影响开发者的开发效率和幸福感。

`Vite`旨在利用生态系统中的新进展解决上述问题：浏览器开始原生支持 ES 模块，且越来越多 JavaScript 工具使用编译型语言编写.

### 快速开始

1. 开始 vite 项目

```bash
pnpm create vite
```

实际全局安装`create-vite`即`vite`脚手架,快速生成主流框架基础模板,然后直接运行`create-vite` **bin**目录下的一个执行配置,了解`pnpm add vite`和`pnpm create vite`的区别,vite 脚手架有最佳实践的配置

### 命令

```bash
vite # 启动开发服务器
vite build # 执行应用构建
vite preview # 构建完应用后，本地启一个静态服务器，预览构建产物
```

### 环境变量

1. `.env`文件

```bash
.env.[mode] # 只在指定模式下加载
```

```json
"prod": "vite --mode production"
```

注意`Vite`默认是不加载`.env`文件的，因为这些文件需要在执行完`Vite`配置后才能确定加载哪一个.使用第三方库`dotenv`读取配置文件`.env`,解析文件中的环境变量,注入进`process`对象,`vite`考虑和其他配置的冲突不会直接将环境变量插入`process`,可以调用`Vite`导出的`loadEnv`函数来加载指定的`.env`文件

```js
// 无prefixes,只获取前缀为'VITE_'的环境变量;prefixes: '',来加载所有环境变量，而不管是否有 `VITE_` 前缀;prefixes: ['VITE_','VUE_'],只拿定制前缀开头的变量
function loadEnv(
  mode: string,
  envDir: string,
  prefixes: string | string[] = 'VITE_',
): Record<string, string>

// process.cwd() 当前执行node命令时候的文件夹地址 ——工作目录;__dirname 被执行的js 文件的地址 ——文件所在目录
const env = loadEnv(mode, process.cwd(),'')
```

2. `import.meta.env`对象

- import.meta.env.MODE:{string} 应用运行的模式
- import.meta.env.BASE_URL:{string} 部署应用时的基本 URL。他由 base 配置项决定
- import.meta.env.PROD:{boolean} 应用是否运行在生产环境
- import.meta.env.DEV:{boolean} 应用是否运行在开发环境 (永远与 import.meta.env.PROD 相反)。
- import.meta.env.SSR:{boolean} 应用是否运行在 server 上

```js
// 以 envPrefix 开头的环境变量会通过 import.meta.env 暴露在你的客户端源码中
export default defineConfig({
  envPrefix: 'VITE_', // string || string[]
})
```

3. 补充

- 为什么 vite.config.js 可以书写 esmodule 的形式?因为 vite 在读取 vite.config.js 的时候 node 率先会将 esmodule 转换成 commonjs,node 即可识别
- 如果环境变量不是以`VITE`开始，不会在客户端暴露至`import.meta.env`,可以通过`envPrefix`手动更改前缀

### 配置

#### vite.config

```js
export default defineConfig({
  cacheDir: 'node_modules/.vite', // 默认值。存储缓存文件的目录。
  envPrefix: 'VITE_', // 通过import.meta.env暴露在应用源码中
})
```

#### vite 处理 css

1. vite 读取 main.js 引用的 index.css
2. 直接用 fs 读取 index.css 中文件内容
3. 创建 style 标签，将 css 文件 copy 进 style 标签
4. 将 style 标签插入到 index.html 的 header
5. 将该 css 文件中的内容直接替换 js 脚本(方便热更新或者 css 模块化)，同时设置 content-type 为 js，从而让浏览器以 js 脚本的形式来执行该 css

#### cssModule

1. 将所有类名进行一定规则的替换（footer 替换成\_footer_122_1）
2. 同时创建一个映射对象{footer: '\_footer_122_1'}
3. 将替换过的内容将 style 标签放入 header
4. 将 module.css 全部抹除，替换成 js
5. 将创建的映射对象在脚本中进行默认导出

```js
css: {
  // 配置同步至postcss modules
  modules: {
    localsConvention: 'camelCase',
    scopeBehaviour: 'local',
    generateScopedName: ''
  },
},
```

#### 别名配置

```js
resolve: {
  alias: {
    '@': path.resolve(__dirname, 'src')
  }
}
```

#### 分包策略

默认会将第三方资源和业务代码打包为一个文件,每次页面去请求这个文件时,因为浏览器缓存机制是名字没有变化即读取缓存,不会重新拿服务器数据;如果文件名加了`hash`值,每次内容改变文件名也改变,但是文件大小没有改变,依然是要加载同样的文件【第三方资源+业务代码】,请求的js文件体积大导致响应慢,所以要进行分包处理，将第三方资源和业务代码分开打包,静态不变的第三方资源包不会变更直接读取缓存,变化的业务代码重新从服务器拉取

```js
// 在 Vite 2.8 及更早版本中，默认的策略是将 chunk 分割为 index 和 vendor
export default defineConfig({
  build: {
    output: {
      manualChunks: (id) => {
        if (id.includes('node_modules')) {
          return 'vendor'
        }
      },
    },
  },
})
// 从 Vite 2.9 起，manualChunks 默认情况下不再被更改。你可以通过在配置文件中添加 splitVendorChunkPlugin 来继续使用 “分割 Vendor Chunk” 策略
// vite.config.js
import { splitVendorChunkPlugin } from 'vite'
export default defineConfig({
  plugins: [splitVendorChunkPlugin()],
})
```

#### 跨域配置

- 跨域：遵循浏览器同源策略规则
- 服务端不存在跨域，相当于用开发服务器访问三方接口，浏览器就报不会跨域错误

##### 开发配置

```js
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://jsonplaceholder.typicode.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
```

##### 生产配置

1. nginx: 代理服务
2. 配置身份标记: `access-control-allow-origin`
