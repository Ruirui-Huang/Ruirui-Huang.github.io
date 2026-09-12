---
title: OpenMMLab
date: 2022-05-07 10:32:14
updated: 2026-09-12 11:45:00
tags:
  - 深度学习
  - 训练框架
categories:
  - pytorch
description: OpenMMLab 训练框架学习笔记。
mathjax: true
---

<!-- more -->

## 前言

以下是在学习、使用OpenMMLab2.0的过程中，总结的学习报告、博客等等，以及针对部分问题提出的个人看法，特此记录！

## 新架构

> 通用、统一、灵活

- 通用：新的训练器以统一的方式实现数据、模型、评测等组件的构造流程供各算法库调用

- 统一：将不同的算法的训练流程拆解成数据、数据变换、模型、评测、可视化等抽象。统一接口的同时，通过MMEngine注册器管理

- 细粒度的模块化设计，提供"乐高"式训练

### MMEngine
用户说明文档：<https://mmengine.readthedocs.io/zh_CN/latest/>

<figure id="Runner" data-latex-placement="H">
<img src="/images/openmmlab/MMEngine.jpg" style="height:5cm;max-width:100%;height:auto;display:block;margin:0 auto;" />
<figcaption>更加强大的Runner</figcaption>
</figure>

训练引擎的核心模块是[执行器（Runner）](https://mmengine.readthedocs.io/zh_CN/latest/tutorials/runner.html)，如图[1](#Runner)。为了允许用户拓展、插入和执行自定义逻辑，执行器设置了丰富的[钩子（Hook）](https://mmengine.readthedocs.io/zh_CN/latest/tutorials/hook.html)，如图[2](#Hook)。

<figure id="Hook" data-latex-placement="H">
<img src="/images/openmmlab/Hook.jpg" style="width:12cm;max-width:100%;height:auto;display:block;margin:0 auto;" />
<figcaption>丰富的Hook点位</figcaption>
</figure>

#### 执行器

执行器主要调用如下组件来完成训练和推理过程中的循环：

- 数据集（Dataset）

- 模型（Model）

- 优化器（Optimizer）：执行反向传播优化模型。 在MMEngine中，官方对优化器做了一层封装：[OptimWrapper](https://mmengine.readthedocs.io/zh_CN/latest/tutorials/optim_wrapper.html)，其优点如下：

  <figure id="Optimizer" data-latex-placement="H">
  <img src="/images/openmmlab/Optimizer.jpg" style="height:6cm;max-width:100%;height:auto;display:block;margin:0 auto;" />
  <figcaption>优化器封装优点</figcaption>
  </figure>

- 参数调度器（Parameter Scheduler）：训练过程中对学习率、动量等优化器超参数动态调整，还支持调度器之间的自由组合

  <figure id="Scheduler" data-latex-placement="H">
  <p><br />
  </p>
  <figcaption>灵活的参数调度器</figcaption>
  </figure>

[Runner]{style="color: gray"}中使用的钩子分为两类：

- 默认钩子（[default hooks]{style="color: gray"}）

  ```python
  default_hooks = dict(
          timer=dict(type='IterTimerHook'),
          logger=dict(type='LoggerHook', interval=50, log_metric_by_epoch=False),
          param_scheduler=dict(type='ParamSchedulerHook'),
          checkpoint=dict(type='CheckpointHook', by_epoch=False, interval=32000),
          sampler_seed=dict(type='DistSamplerSeedHook'),
          visualization=dict(type='SegVisualizationHook'))
  ```

    钩子                                      功能
    ----------------------------------------- ----------------------------------------------------------------------------------------------
    IterTimerHook                             记录 iteration 花费的时间
    LoggerHook                                从 Runner 里不同的组件中收集日志记录, 并将其输出到终端, JSON 文件, tensorboard, wandb 等下游
    ParamSchedulerHook                        更新优化器里面的一些超参数, 例如学习率的动量
    CheckpointHook                            规律性地保存 checkpoint 文件
    DistSamplerSeedHook                       确保分布式采样器 shuffle 是打开的
    SegVisualizationHook   可视化验证和测试过程里的预测结果

- 自定义钩子

模型和各模块之间具体的数据流如下：

<figure id="Pipeline" data-latex-placement="H">
<img src="/images/openmmlab/Pipeline.jpg" style="width:12cm;max-width:100%;height:auto;display:block;margin:0 auto;" />
<figcaption>模型和各模块之间具体的数据流</figcaption>
</figure>

在训练间隙或者测试阶段，[评测指标与评测器（Metrics & Evaluator）](https://mmengine.readthedocs.io/zh_CN/latest/tutorials/evaluation.html)负责对模型性能进行评测。其中，

- Metric负责实现根据测试数据和模型预测结果，完成模型特定精度指标的计算

- Evaluator类则位于Metric上层，为Metric提供格式转换以及分布式通信的支持

> [Q：]{style="color: red"}既然Runner、Hook 这些核心组件都在MMEngine里实现了，那MMCV还有啥嘞？架构升级后，还能用MMCV做哪些事情？
>
> [A：]{style="color: red"}详见[2.2](#MMCV)节

>  [Q：]{style="color: red"}数据预处理模型 [data_preprocessor]{style="color: gray"} 和数据集 [trasform]{style="color: gray"}有何不同？
>
> [A：]{style="color: red"}这一模块在从dataloader获得数据后，对数据进行搬运，并加速预处理。和trasform的不同在于：
>
> - transform每次调用只处理一张图片，而data_preprocessor每次调用处理一个batch的图片
>
> - transform可以包含复杂逻辑，对每张图像执行不同操作，由CPU执行，而data_preprocessor可以获取模型所在的设备，能够利用GPU加速对一个batch的图像进行批量处理，进而实现加速
>
> 用法上，原先数据集pipeline中的Normalize变换操作可以移除，代之以单独的data_preprocessor配置字段。

为了统一接口，OpenMMLab 2.0 中各个算法库的评测器，模型和数据之间交流的接口都使用了[数据元素（Data Element）](https://mmengine.readthedocs.io/zh_CN/latest/advanced_tutorials/data_element.html)来进行封装。

在训练、推理执行过程中，上述各个组件都可以调用日志管理模块和可视化器进行结构化和非结构化日志的存储与展示。[日志管理（Logging Modules）](https://mmengine.readthedocs.io/zh_CN/latest/advanced_tutorials/logging.html)：负责管理执行器运行过程中产生的各种日志信息。其中消息枢纽（MessageHub）负责实现组件与组件、执行器与执行器之间的数据共享，日志处理器（Log Processor）负责对日志信息进行处理，处理后的日志会分别发送给执行器的日志器（Logger）和可视化器（Visualizer）进行日志的管理与展示。[可视化器（Visualizer）](https://mmengine.readthedocs.io/zh_CN/latest/advanced_tutorials/visualization.html)：可视化器负责对模型的特征图、预测结果和训练过程中产生的结构化日志进行可视化，支持 Tensorboard 和 MLflow 等多种可视化后端。

#### 可视化后端

**TensorBoard**

- 介绍\
  TensorBoard最初是随TensorFlow提出的一款可视化工具包，其便捷性和完善的记录功能使它得到了广泛应用，并扩展到 PyTorch等多种深度学习框架。TensorBoard支持记录多种数据类型：

  - 指标和损失

  - 超参数和模型config

  - 图片数据

  - 模型图

  - Embedding Projector（在低维空间可视化高维数据）

- 使用

  - 安装tensorboard：pip install tensorboard

  - 修改vis_backends字段

    ```python
    vis_backends = [
            dict(
                type='TensorboardVisBackend',
                save_dir = work_dir)
        ]
    ```

  - 运行：[tensorboard --logdir work_dir]{style="background-color: gray"}

  - 后台展示：浏览器输入<http://localhost:6006/>

**MLflow**

- 介绍\
  MLflow是一个用于记录机器学习生命周期的开源工具，实验记录和可视化只是其中一个基础功能，因此它的可视化功能不如Neptune和WandB那样丰富灵活。MLflow支持记录的数据类型有：

  - 指标和损失

  - 超参数和模型config

  - Git信息

  - Artifacts（图片、模型、数据等）

  **注**：MLflow只能以artifacts的形式记录图片，没有交互式功能，因此很难从图片中直接获取实验数据。MLflow也不适用于大型实验，过多的实验可能导致UI滞后。然而，MLflow的主要优势在于机器学习生命周期的完整记录，包括实验可复现性的实现、模型注册、模型和数据的版本管理等。

- 使用\

  - 安装mlflow：pip install mlflow

  - 修改vis_backends字段

    ```python
    vis_backends = [
            dict(
                type='MLflowVisBackend',
                save_dir = work_dir,
                exp_name = "356542",
                run_name = "20220724",
                artifact_suffix = ('.pth'))
        ]
    ```

  - 运行：[tensorboard --logdir work_dir]{style="background-color: gray"}

  - 后台展示

    - windows：浏览器输入<http://localhost:5000/>

    - linux：使用管道或者[mlflow server --host 0.0.0.0]{style="background-color: gray"}

<figure data-latex-placement="H">
<p><br />
</p>
<figcaption>全新的架构设计。图<a href="#原架构训练逻辑" data-reference-type="ref" data-reference="原架构训练逻辑">[原架构训练逻辑]</a>为原来的架构训练逻辑；图<a href="#新架构训练逻辑" data-reference-type="ref" data-reference="新架构训练逻辑">[新架构训练逻辑]</a>为新的架构训练逻辑</figcaption>
</figure>

总而言之，在新的架构中，MMEngine的执行器集中了所有的模块构建功能，训练脚本只用于最基本的配置解析，如图[\[新架构训练逻辑\]](#新架构训练逻辑)，这样新的训练流程不仅逻辑更加清晰，大大减少了代码量，还能为用户带来更方便的模型调试体验，让用户灵活地定义模型的前向和方向过程。

### MMCV
> MMCV2.x两大变化：模块增删 & 包名变更

#### 模块增删

MMCV1.x中主要包含Runner、Hook、Parallel、Registry、Config、FileIO、Image/Video、CNN和OPS组件。

在MMCV2.x中，和训练流程相关的组件被删除了，由MMEngine提供，只保留图像视频处理、网络基础模块和算子。除此之外，还新增了数据预处理模块（Transform），如图[6](#MMCV2.x)。

<figure id="MMCV2.x" data-latex-placement="H">
<img src="/images/openmmlab/MMCV.jpg" style="height:5cm;max-width:100%;height:auto;display:block;margin:0 auto;" />
<figcaption>MMCV2.x模块的变化</figcaption>
</figure>

以分类任务为例，图[7](#Datapipeline_cls)展示的是一个典型的数据流水线。

<figure id="Datapipeline_cls" data-latex-placement="H">
<img src="/images/openmmlab/Datapipeline_cls.jpg" style="height:5cm;max-width:100%;height:auto;display:block;margin:0 auto;" />
<figcaption>一个典型的数据流水线。对每个样本，数据集中保存的基本信息是最左侧所示的字典，之后每经过一个由蓝色块代表的数据变换操作，数据字典中都会加入新的字段（标记为绿色）或更新现有的字段（标记为橙色）</figcaption>
</figure>

**数据加载**

为了支持大规模数据集的加载，通常在Dataset初始化时不加载数据，只加载相应的路径。因此需要在数据流水线中进行具体数据的加载。

      数据变换类      功能
  ------------------- -------------------------------------------
   LoadImageFromFile  根据路径加载图像
    LoadAnnotations   加载和组织标注信息，如 bbox、语义分割图等

  : 数据加载

**数据变换**

按照功能，常用的数据变换类有数据预处理与增强、数据格式化。

数据预处理和增强通常是对图像本身进行变换，如裁剪、填充、缩放等。

         数据变换类        功能
  ------------------------ ------------------------------------
            Pad            填充图像边缘
         CenterCrop        居中裁剪
         Normalize         对图像进行归一化
           Resize          按照指定尺寸或比例缩放图像
        RandomResize       缩放图像至指定范围的随机尺寸
   RandomMultiscaleResize  缩放图像至多个尺寸中的随机一个尺寸
      RandomGrayscale      随机灰度化
         RandomFlip        图像随机翻转
     MultiScaleFlipAug     支持缩放和翻转的测试时数据增强

  : 数据预处理及增强

数据格式化操作通常是对数据进行的类型转换。

    数据变换类                  功能
  --------------- --------------------------------
     ToTensor      将指定的数据转换为torch.Tensor
   ImageToTensor     将图像转换为 torch.Tensor

  : 数据格式化

此外，数据变换还提供了四个特殊的数据变换类，主要作用是对其中定义的数据变化行为进行增强。分别是：

- **字段映射（KeyMapper）**：用于对数据字典中的字段进行映射。以RandomFlip为例

  <figure data-latex-placement="H">
  <img src="/images/openmmlab/KeyMapper.jpg" style="width:5cm;max-width:100%;height:auto;display:block;margin:0 auto;" />
  <figcaption>RandomFlip要求输入的字典中包含img 字段，但是用户的输入只包含了gt_img字段，这种情况下可以用KeyMapper将gt_img字段映射为img字段，在RandomFlip完成处理后再将img映射回gt_img</figcaption>
  </figure>

- **随机选择（RandomChoice）**：用于从一系列数据变换组合中随机应用一个数据变换组合。以AutoAugment为例

  <figure data-latex-placement="H">
  <img src="/images/openmmlab/RandomChoice.jpg" style="height:5cm;max-width:100%;height:auto;display:block;margin:0 auto;" />
  <figcaption>两组transform，其中有40%的概率选择第一组，60%的概率选择第二组</figcaption>
  </figure>

- **随机执行（RandomApply）**

- **多目标扩展（TransformBroadcaster）**

#### 包名变更

| 包名 | &lt;2.0 | ≥ 2.0 |
| --- | --- | --- |
| mmcv-full | 包含CUDA算子 | 无 |
| mmcv | 不包含CUDA算子 | 包含CUDA算子 |
| mmcv-lite | 无 | 不包含CUDA算子 |

  : 为避免用户混淆，将包名重命名

## MMYOLO

> [Q：]{style="color: red"}为啥要推出MMYOLO？为何要单独开一个仓库而不是直接放到MMDetection中？
>
> [A：]{style="color: red"}答案可以归纳为以下三点：
>
> - **统一运行和推理平台**：目前目标检测领域出现了非常多 YOLO 的改进算法，并且非常受大家欢迎，但是这类算法基于不同框架不同后端实现，存在较大差异，缺少统一便捷的从训练到部署的公平评测流程
>
> - **协议限制**：众所周知，YOLOv5以及其衍生的YOLOv6和YOLOv7等算法都是GPL3.0协议，不同于MMDetection的Apache协议。由于协议问题，无法将MMYOLO直接并入MMDetection中
>
> - **多任务支持**：MMYOLO任务不局限于MMDetection，还会支持基于MMPose实现关键点相关的应用，以及基于MMTracking实现追踪相关的应用，因此不太适合直接并入MMDetection

### 训练技巧

#### 提升检测性能

- [**多尺度训练**](https://mmyolo.readthedocs.io/zh_CN/dev/common_usage/ms_training_testing.html)：在YOLO中大部分模型的训练输入都是单尺度的 640x640，原因有两个方面

  - 单尺度训练速度快。当训练epoch在300或者500的时候训练效率是用户非常关注的，多尺度训练会比较慢

  - 训练pipeline中隐含了多尺度增强，等价于应用了多尺度训练，典型的如Mosaic、RandomAffine和Resize等，故没有必要再次引入模型输入的多尺度训练。

  因此，如果直接在YOLOv5的DataLoader输出后再次引入多尺度训练增强实际性能提升非常小，但是这不代表用户自定义数据集微调模式下没有明显增益

  > [Q：]{style="color: red"}常用的多尺度训练实现方式
  >
  > [A：]{style="color: red"}有两种实现方式：
  >
  > - 在 train_pipeline 中输出的每张图都是不定尺度的，然后在 [DataPreprocessor]{style="color: gray"} 中将不同尺度的输入图片通过 [stack_batch]{style="color: gray"} 函数填充到同一尺度，从而组成 batch 进行训练【MMDet 中大部分算法都是采用这个实现方式】
  >
  > - 在 train_pipeline 中输出的每张图都是固定尺度的，然后直接在 [DataPreprocessor]{style="color: gray"} 中进行 batch 张图片的上下采样，从而实现多尺度训练功能
  >
  > 理论上第一种实现方式所生成的尺度会更加丰富，但是由于其对单张图进行独立增强，训练效率不如第二种方式。
  >
  > ```python
  > model = dict(
  >     data_preprocessor=dict(
  >         type='YOLOv5DetDataPreprocessor',
  >         pad_size_divisor=32,
  >         batch_augments=[
  >             dict(
  >                 type='YOLOXBatchSyncRandomResize',
  >                 # 多尺度范围是 480~800
  >                 random_size_range=(480, 800),
  >                 # 输出尺度需要被 32 整除
  >                 size_divisor=32,
  >                 # 每隔 1 个迭代改变一次输出输出
  >                 interval=1)
  >         ])
  >     )
  > ```

- **使用Mask标注优化目标检测性能**

- **训练后期关闭强增强提升检测性能**：该策略是在YOLOX算法中第一次被提出，可以极大地提升检测性能。 论文中指出虽然Mosaic+MixUp可以极大地提升目标检测性能，但是它生成的训练图片远远脱离自然图片的真实分布，并且Mosaic大量的裁剪操作会带来很多不准确的标注框，所以YOLOX提出在最后15个epoch关掉强增强，转而使用较弱的增强，从而让检测器避开不准确标注框的影响，在自然图片的数据分布下完成最终的收敛。

- **自动混合精度**

  ```python
  if args.amp is True:
      optim_wrapper = cfg.optim_wrapper.type
      if optim_wrapper == 'AmpOptimWrapper':
          print_log(
              'AMP training is already enabled in your config.',
              logger='current',
              level=logging.WARNING)
      else:
          assert optim_wrapper == 'OptimWrapper', (
              '`--amp` is only supported when the optimizer wrapper type is '
              f'`OptimWrapper` but got {optim_wrapper}.')
          cfg.optim_wrapper.type = 'AmpOptimWrapper'
          cfg.optim_wrapper.loss_scale = 'dynamic'
  ```

#### 冻结指定网络层权重

- 冻结 backbone 权重 在 MMYOLO 中可以通过设置 [frozen_stages]{style="color: gray"} 参数去冻结主干网络的部分 stage, 使这些 stage 的参数不参与模型的更新。

  **注：**frozen_stages = i 表示的意思是指从最开始的 stage 开始到第 i 层 stage 的所有参数都会被冻结。下面是 YOLOv5 的例子：

  ```python
  model = dict(
      backbone=dict(
          frozen_stages=1 # 表示第一层 stage 以及它之前的所有 stage 中的参数都会被冻结
      ))
  ```

- 冻结 neck 权重 MMYOLO 中也可以通过参数 [freeze_all]{style="color: gray"} 去冻结整个 neck 的参数。下面是 YOLOv5 的例子：

  ```python
  model = dict(
      neck=dict(
          freeze_all=True # freeze_all=True 时表示整个 neck 的参数都会被冻结
      ))
  ```

#### 算法组合

参考：[算法组合替换教程](https://github.com/open-mmlab/mmyolo/blob/main/docs/zh_cn/common_usage/module_combination.md)

- Loss 组合

  - 使用 LabelSmoothLoss 作为 loss_cls 的损失函数。其中 LabelSmoothLoss 已经在 MMClassification 中实现了，所以可以直接在配置文件中进行替换。配置文件如下：

    ```python
    model = dict(
        bbox_head=dict(
          loss_cls=dict(
            _delete_=True,
            _scope_='mmcls', #  临时替换 scope 为 mmcls
            type='LabelSmoothLoss',
            label_smooth_val=0.1,
            mode='multi_label',
            reduction='mean',
            loss_weight=0.5)))
    ```

  - 使用 VarifocalLoss 作为 loss_cls 的损失函数。其中 VarifocalLoss 在 MMDetection 已经实现好了，所以可以直接替换。配置文件如下：

    ```python
    model = dict(
        bbox_head=dict(
            loss_cls=dict(
                _delete_=True,
                _scope_='mmdet',
                type='VarifocalLoss',
                loss_weight=1.0)))
    ```

  - 使用 FocalLoss 作为 loss_cls 的损失函数。配置文件如下：

    ```python
    model = dict(
        bbox_head=dict(
            loss_cls= dict(
                _delete_=True,
                _scope_='mmdet',
                type='FocalLoss',
                loss_weight=1.0)))
    ```

  - 使用 QualityFocalLoss 作为 loss_cls 的损失函数。配置文件如下：

    ```python
    model = dict(
            bbox_head=dict(
              loss_cls= dict(
                _delete_=True,
                _scope_='mmdet',
                type='QualityFocalLoss',
                loss_weight=1.0)))
    ```

## MMSegmentation

[版本匹配详情](https://github.com/open-mmlab/mmsegmentation/blob/master/docs/zh_cn/notes/faq.md)

### 数据结构

MMSegmentation1.0引入了SegDataSample数据结构，将语义分割中的数据封装起来，用于各个功能模块之间的数据传递，SegDataSample里面的字段有：gt_sem_seg、pred_sem_seg、seg_logits 和 metainfo。前两个分别是标签和模型预测对应的分割掩膜（segmeation mask），seg logits是模型最后一层没有经过归一化的输出。

```python
if C > 1:
        i_seg_pred = i_seg_logits.argmax(dim=0, keepdim=True)
    else:
        i_seg_logits = i_seg_logits.sigmoid()
        i_seg_pred = (i_seg_logits > self.decode_head.threshold).to(i_seg_logits)
    data_samples[i].set_data({
        'seg_logits': PixelData(**{'data': i_seg_logits}),
        'pred_sem_seg': PixelData(**{'data': i_seg_pred})
```

### 数据集和数据变化

MMSegmentation1.0新定义了BaseSegDataset，规范了语义分割数据集功能和接口，是 MMEngine中BaseDataset的子类。数据集主要的功能是加载数据信息，数据信息有两种，一种是数据集的元信息，包括类别信息和调色板信息，就是渲染时类别对应的颜色；另一种是数据信息，保存了具体数据集中图片路径和对应的标签路径。

一个典型的语义分割模型训练时的数据变换流水线，如图[8](#Datapipeline_seg)所示。

<figure id="Datapipeline_seg" data-latex-placement="H">
<img src="/images/openmmlab/Datapipeline_seg.jpg" style="height:5cm;max-width:100%;height:auto;display:block;margin:0 auto;" />
<figcaption>一个典型的语义分割模型训练时的数据变换流水线。对每个样本，数据集中保存的基本信息是最左侧所示的字典，之后每经过一个由蓝色块代表的数据变换操作，数据字典中都会加入新的字段（标记为绿色）或更新现有的字段（标记为橙色）</figcaption>
</figure>

### 模型

MMSegmentation中将语义分割算法模型称为segmentor，共6个模块，分别是：

- data_preprocessor，详见[\[数据预处理模型\]](#数据预处理模型)

- Backbone，常见的模型有ResNet，Swin transformer等

- Neck，常见的网络有Feature Pyramid Network（FPN）

- decode_head

- auxiliary_head（可选）

- loss

segmentor的模型结构根据是否由多个decode_head 集联，分为encoder_decoder 和cascade_encoder_decoder两种。

<figure data-latex-placement="H">
<p><br />
</p>
<figcaption>语义分割数据流。图<a href="#encoder_decoder数据流" data-reference-type="ref" data-reference="encoder_decoder数据流">[encoder_decoder数据流]</a>为encoder_decoder数据流；图<a href="#cascade_encoder_decoder数据流" data-reference-type="ref" data-reference="cascade_encoder_decoder数据流">[cascade_encoder_decoder数据流]</a>为cascade_encoder_decoder数据流</figcaption>
</figure>

[decode_head]{style="color: gray"} 的 [loss_by_feat]{style="color: gray"} 方法是用于计算损失的统一接口。

```python
Args:
        seg_logits (Tensor)：解码头前向函数的输出batch_data_samples (List[SegDataSample])：分割数据样本，通常包括如 metainfo 和 gt_sem_seg 等信息
    Return:
        dict[str, Tensor]：一个损失组件的字典
```

数据流协议分为训练和测试两种。

如图[\[训练时的数据流\]](#训练时的数据流)，训练的时候，dataloader搬运经过data transforms处理的数据，传给模型train_step方法，模型里会先调数据预处理模块，再传给模型的forward函数，前传并计算损失。这个loss dict会经过parse_losses模块解析，得到一个loss scalar，然后在opitimizer warpper 里的update_params对模型反传，计算梯度，并更新参数。

如图[\[测试时的数据流\]](#测试时的数据流)，测试时，数据会传给模型的test_step方法，同样是先经过预处理，predict输出datasample。这里的datasample就是输入网络的datasample，只不过新增了pred_sem_seg和seg_logits两个字段用以保存网络的预测结果。将这个修改后的data sample和inputs送到评测器计算评测指标，或者送到可视化器中进行处理。

<figure data-latex-placement="H">
<p><br />
</p>
<figcaption>数据流协议。图<a href="#训练时的数据流" data-reference-type="ref" data-reference="训练时的数据流">[训练时的数据流]</a>为训练时的数据流；图<a href="#测试时的数据流" data-reference-type="ref" data-reference="测试时的数据流">[测试时的数据流]</a>为测试时的数据流</figcaption>
</figure>

### 训练技巧

#### 主干网络和解码头组件使用不同的学习率

配置文件里添加如下行来让解码头组件的学习率是主干组件的10倍，这样可以获得更好的表现或更快的收敛

```python
optim_wrapper=dict(
    paramwise_cfg = dict(
        custom_keys={
            'head': dict(lr_mult=10.)}))
```

#### 在线难样本挖掘

Online Hard Example Mining（OHEM），可以解决样本不平衡问题

```python
model=dict(
        decode_head=dict(
            sampler=dict(type='OHEMPixelSampler', thresh=0.7, min_kept=100000)))
```

通过这种方式，只有置信分数在0.7以下的像素值点会被拿来训练。在训练时我们至少要保留100000个像素值点。如果 thresh 并未被指定，前 min_kept 个损失的像素值点才会被选择。

#### 类别平衡损失

对于不平衡类别分布的数据集，可以改变每个类别的损失权重

```python
model=dict(
        decode_head=dict(
            loss_decode=dict(
                type='CrossEntropyLoss', use_sigmoid=False, loss_weight=1.0,
                # DeepLab 对 cityscapes 使用这种权重
                class_weight=[0.8373, 0.9180, 0.8660, 1.0345, 1.0166, 0.9969, 0.9754, 1.0489, 0.8786, 1.0023, 0.9539, 0.9843, 1.1116, 0.9037, 1.0865, 1.0955, 1.0865, 1.1529, 1.0507])))
```

#### 同时使用多种损失函数

对于训练时损失函数的计算，支持多个损失函数同时使用

```python
model = dict(
        decode_head=dict(loss_decode=[
            dict(type='CrossEntropyLoss', loss_name='loss_ce', loss_weight=1.0),
            dict(type='DiceLoss', loss_name='loss_dice', loss_weight=3.0)
        ]),
        auxiliary_head=dict(loss_decode=[
            dict(type='CrossEntropyLoss', loss_name='loss_ce', loss_weight=1.0),
            dict(type='DiceLoss', loss_name='loss_dice', loss_weight=3.0)
        ]),
    )
```

**注：**loss_name 的名字必须带有 loss\_ 前缀，这样它才能被包括在计算图里。

## OpenMMLab VS PaddlePaddle

OpenMMLab & PaddlePaddle均可分为定制和通用两个部分。

+:--------:+:-------------------------------+:--------------------------------------+
| **流程** | **详情**                                                               |
|          +--------------------------------+---------------------------------------+
|          |                                |                                       |
+----------+--------------------------------+---------------------------------------+
| 步骤1    | 设计网络结构                   | 网络模块 & 原子函数                   |
|          +--------------------------------+---------------------------------------+
|          | 指定Loss函数                   | Loss函数实现                          |
|          +--------------------------------+---------------------------------------+
|          | 指定优化算法                   | 优化算法实现                          |
+----------+--------------------------------+---------------------------------------+
| 步骤2    | 提供数据格式 & 接入数据方式    | 为模型批量送入数据 (Feed、Py_reader)  |
+----------+--------------------------------+---------------------------------------+
| 步骤3    | 单机和多机配置                 | 单机到多机转换 (transpile) & 训练程序 |
+----------+--------------------------------+---------------------------------------+
| 步骤4    | 确定保存模型和加载模型的环节点 | 保存模型                              |
+----------+--------------------------------+---------------------------------------+
| 步骤5    | 指定评估指标                   | 指标实现 & 图形化工具                 |
+----------+--------------------------------+---------------------------------------+
| 步骤6    | 主程序                         | \-                                    |
+----------+--------------------------------+---------------------------------------+
| 附       | 个性化评估定制                 | 性能分析                              |
+----------+--------------------------------+---------------------------------------+

   系列   OpenMMLab    Paddle
  ------ ----------- ----------
    OS      4.3k      **5.3k**
    OC      1.5k      **4.3k**
    OD     **21k**      8.3k

  : OpenMMLab & Paddle算法框架系列Star对比

[OpenMMLab](https://openmmlab.com/) 基于PyTorch，是一个适用于学术研究和工业应用的开源算法体系【迄今最为完备，偏向科研】

[PaddlePaddle](https://www.paddlepaddle.org.cn/) 的API代码风格基本模仿PyTorch【学术上几乎没有份额，工业上依靠百度自己开源的项目】，上手快，使用下来最大的问题是Paddle性能有点拉跨，但是由于是百度自己开源的，相对稳定。

## 附录

### 如何选择模型训练的batch size 和 learning rate

- Batch size对模型训练的影响\

  > - 大的batch size效率高、蓄力时间长、更稳定，但小的batch size更有利于Training
  >
  >   <figure data-latex-placement="H">
  >   <img src="/images/openmmlab/batch_size.jpg" style="width:12cm;max-width:100%;height:auto;display:block;margin:0 auto;" />
  >   <figcaption>不同的batch size对训练结果的影响</figcaption>
  >   </figure>

- Learning rate对模型训练的影响\

  - Adagrad：坡度比较大时的学习率较小，坡度比较小时候的学习率较大
