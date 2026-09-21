# USCOO

O-1A application preparation workspace for founders and immigration professionals.

[Try USCOO](https://www.uscoo.ai/?utm_source=github&utm_medium=referral&utm_campaign=open_source) · [Start an assessment](https://www.uscoo.ai/assessment?utm_source=github&utm_medium=referral&utm_campaign=open_source) · [中文介绍](#中文介绍)

> Release preparation: this repository currently contains project documentation. Application source and a license have not yet been published. A standalone deployment is not yet verified.

## Why USCOO

USCOO grew out of a founder's experience preparing an O-1A application. It brings scattered achievements, supporting evidence, preparation tasks, and timelines into an organized workflow.

Whether a founder is in the United States or elsewhere, the goal is to help describe achievements in relation to the O-1A evidentiary criteria and identify what supporting material still needs to be collected. An assessment is a preparation aid, not an eligibility determination or an approval prediction.

## For founders

The hosted application provides workflows for assessing achievements, organizing evidence, planning preparation tasks, and preparing materials for a conversation with immigration counsel. You can use the online application without installing code.

## For immigration professionals

We welcome feedback and exploratory collaboration on structured client intake, evidence organization, preparation timelines, and attorney handoff materials. These are collaboration areas, not a claim that a production multi-client law-firm system or public API is available.

For collaboration inquiries: **coo@uscoo.ai**. Please describe the workflow you would like to improve; do not send client case files in an initial inquiry.

## Release scope

The first source release is intended to include reviewed application code, setup documentation, configuration examples, and synthetic examples. It will exclude production credentials, user records, uploaded evidence, personal petition documents, and production Git history.

Current portability review has identified platform-specific authentication and build configuration. Authentication currently relies on identity headers supplied by a trusted hosting layer. Those headers must not be trusted directly on a self-hosted public server. A verified authentication integration and deployment instructions are release requirements.

See [release readiness](docs/RELEASE_READINESS.md) for remaining work. There are no installation instructions until they have been validated.

## Project boundaries

USCOO supports preparation and organization. It is not a law firm and does not provide legal representation, guarantee outcomes, or submit a petition on your behalf. Case-specific legal judgments remain with qualified counsel. Do not submit personal immigration records in public issues or pull requests.

Maintenance is best-effort; no response-time commitment or feature delivery schedule is offered.

## License

A license will be added after the source and third-party notices are reviewed. This preparation repository does not yet grant an open-source license.

## 中文介绍

USCOO 是面向创始人与移民专业人士的 O-1A 申请准备工作台，源于一位创始人整理自身 O-1A 申请经验的实践。

无论身在美国还是其他国家，申请者都可以通过系统梳理成就、对照 O-1A 证据标准、整理分散材料，并规划申请准备时间线。评估结果用于帮助准备材料，不代表资格认定或获批预测。

- **个人申请者**：前往 [uscoo.ai](https://www.uscoo.ai/?utm_source=github&utm_medium=referral&utm_campaign=open_source) 体验。
- **律所与移民专业人士**：欢迎围绕客户资料收集、证据整理、时间线和律师沟通材料提出合作需求，联系 **coo@uscoo.ai**。
- **开发者**：源代码、许可证与经过验证的部署说明正在准备中，目前尚不能通过本仓库独立部署。

首版将使用虚构示例，不包含生产用户资料或个人申请原件。项目采用尽力维护方式，不承诺固定响应时间。USCOO 不提供律师代理服务，也不保证申请结果。
