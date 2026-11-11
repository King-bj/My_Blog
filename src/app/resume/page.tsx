import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, ArrowLeft, Github, Layers, Activity, Workflow } from 'lucide-react';
import { PrintResume } from './print-resume';
import styles from './resume.module.css';

export const metadata: Metadata = {
  title: { absolute: 'King · 运维开发工程师' },
  authors: [{ name: 'King', url: 'https://docs.jinla.fun/' }],
  creator: 'King',
  description: '运维平台研发、自动化与可观测性。以工程实践连接故障发现、诊断与处置。',
  keywords: ['运维开发', '平台工程', '可观测性', 'Java', 'Linux', 'DevOps'],
  openGraph: {
    title: 'King · 运维开发工程师',
    description: '运维平台研发 / 自动化 / 可观测性',
    type: 'profile',
    url: 'https://docs.jinla.fun/resume',
    siteName: 'King 的工程简历',
  },
};

const projects = [
  {
    number: '01', title: '在麒麟 ARM64 上验证进程外链路采集', category: 'eBPF 选型与环境验收',
    tags: ['Beyla / OBI', 'SkyWalking', 'ARM64', 'Linux 4.19'],
    intro: '业务希望独立控制采集资源，同时沿请求找到慢调用。我负责采集方案选型、跨版本验证和适配验收。',
    points: [
      '在测试覆盖的麒麟 V11 环境中，通过 SkyWalking 核对 Trace、耗时和中间件访问。',
      '针对麒麟 V10 SP3，使用 AI 辅助修改 verifier 边界检查和用户态内存读取，隔离不兼容能力。',
      '在 ARM64 / 4.19 验通 HTTP/1.x 主链路端到端采集；异步消息和其他协议需分别验证。',
    ],
  },
  {
    number: '02', title: '把重复操作变成可复用作业', category: '运维自动化平台',
    tags: ['Java', 'Quartz', 'Redis', '任务编排'],
    intro: '负责自动化平台架构与核心研发，将部署、巡检、备份和 Java 服务排查组织为标准流程。',
    points: [
      '实现定时与批量作业、可视化编排，集成审批、权限和失败重试。',
      '通过分布式锁、信号量和任务优先级控制并发，减少重复执行与资源竞争。',
      '编排 CPU 热点、线程堆栈、GC 信息采集，生成诊断报告并归档故障现场。',
    ],
  },
  {
    number: '03', title: '从日志接入走到存储治理', category: '集中式日志平台',
    tags: ['Kafka', 'Flink', 'Elasticsearch', 'CMDB'],
    intro: '负责实时日志平台架构与核心链路，连接采集、加工、检索与数据保留。',
    points: [
      '结合 Flink 与规则引擎实现字段抽取、衍生计算和动态处理。',
      '关联 CMDB 资源与采集策略，规范资源同步、策略绑定及参数化接入。',
      '排查消费积压、背压和写入瓶颈，定位 NFS 存储 IO 问题；结合 ILM 与归档管理数据保留。',
    ],
  },
  {
    number: '04', title: '把集群诊断和回归测试接入交付流程', category: '生产 Kubernetes 与 CI/CD',
    tags: ['Kubernetes', 'RBAC', 'Jenkins', 'SonarQube'],
    intro: '负责运维一体化平台的 Kubernetes 安装、业务探针集成和集群自动化诊断。',
    points: [
      '通过 RBAC 为 kubectl 操作授权，集成 Kubernetes API 获取监控信息；用 Shell / Python 脚本支持集群安装和主备切换。',
      '由 GitHub 指定分支的 webhook 触发 Jenkins，在容器内编译打包并接入 SonarQube 检查。',
      '将接口与 UI 回归拆为冒烟和全量用例，并行执行；失败时归档日志和报告，通知对应责任人。',
    ],
  },
];

const articles = [
  { title: '在麒麟 ARM64 上验证 eBPF 链路采集', subtitle: '4.19 的 HTTP/1.x 验收范围与能力降级', slug: 'kylin-ebpf-tracing' },
  { title: 'Kubernetes 迁移后，为什么多个 Pod 生成了相同的 ID？', subtitle: '排查实例身份冲突，说明 Downward API 的作用和哈希方案的碰撞边界', slug: 'k8s-id' },
  { title: '怎样估算日志与监控平台的容量？', subtitle: '用假设负载估算采集速率、峰值写入和各组件需要观测的指标', slug: 'ops-cap' },
];

export default function ResumePage() {
  return (
    <div className={styles.resume}>
      <div className={styles.toolbar}>
        <Link href="/" className={styles.back}><ArrowLeft size={15} /> 返回博客</Link>
        <span>PUBLIC PROFILE / 公开简历</span>
        <PrintResume />
      </div>
      <article className={styles.sheet} aria-label="King 的公开简历">
        <header className={styles.hero}>
          <div className={styles.eyebrow}><span /> ENGINEERING · OPERATIONS · AUTOMATION</div>
          <div className={styles.heroGrid}>
            <div>
              <p className={styles.name}>King <span>/ 运维开发工程师</span></p>
              <h1>运维平台研发与生产故障排查</h1>
              <p className={styles.lead}>负责企业自动化、日志与监控平台的设计和核心研发。有生产 Kubernetes 运维经验，做过批量作业的并发控制、Kafka → Flink → Elasticsearch 链路排障，以及 ARM64 环境下的 eBPF 采集适配。</p>
            </div>
            <aside className={styles.profile}>
              <p className={styles.smallLabel}>FOCUS / 求职方向</p>
              <p>运维开发 · 平台工程<br />可观测性平台研发</p>
              <div className={styles.divider} />
              <p className={styles.smallLabel}>BACKGROUND / 背景</p>
              <p>Java / Spring Boot<br />Linux / 生产 Kubernetes<br />系统架构师证书</p>
              <a href="https://github.com/King-bj/rc_jinla/blob/main/src/main/java/com/notifyhub/dispatcher/NotificationDispatcher.java" target="_blank" rel="noopener noreferrer"><Github size={15} /> 通知投递代码示例 <ArrowUpRight size={15} /></a>
            </aside>
          </div>
          <div className={styles.focusRow}>
            <span><Workflow size={17} /> 自动化与受控执行</span>
            <span><Activity size={17} /> 指标、日志与链路</span>
            <span><Layers size={17} /> 平台研发与交付</span>
          </div>
        </header>

        <section className={styles.section} aria-labelledby="capabilities">
          <div className={styles.sectionHead}><span>01 / CAPABILITIES</span><h2 id="capabilities">核心能力</h2></div>
          <div className={styles.capabilities}>
            <div><h3>把流程做进平台</h3><p>任务编排、批量执行、审批权限、并发治理与标准作业，将日常运维需求转化为平台能力。</p></div>
            <div><h3>沿数据链路排查问题</h3><p>关注采集、传输、消费和存储各环节，结合 Linux / JVM、队列积压与写入压力定位故障。</p></div>
            <div><h3>把方案交付到现场</h3><p>具备生产 K8s 运维经验，推进镜像构建、私仓发布与探针接入，开展 eBPF 采集适配和工程交付。</p></div>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="projects">
          <div className={styles.sectionHead}><span>02 / SELECTED WORK</span><h2 id="projects">代表项目</h2></div>
          <div className={styles.projects}>
            {projects.map(project => (
              <div className={styles.project} key={project.number}>
                <div className={styles.projectNumber}>{project.number}</div>
                <div>
                  <p className={styles.category}>{project.category}</p>
                  <h3>{project.title}</h3>
                  <p>{project.intro}</p>
                  <ul>{project.points.map(point => <li key={point}>{point}</li>)}</ul>
                  <div className={styles.tags}>{project.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="experience">
          <div className={styles.sectionHead}><span>03 / EXPERIENCE</span><h2 id="experience">经历脉络</h2></div>
          <div className={styles.timeline}>
            <div><span>2024 年起</span><h3>生产 Kubernetes 运维</h3><p>承担平台集群安装、应用探针集成与自动化诊断。</p></div>
            <div><span>2019 年 11 月起</span><h3>运维平台研发</h3><p>负责运维平台研发，后任技术经理，覆盖自动化、日志、监控与 APM。</p></div>
            <div><span>2016 年起</span><h3>Java 后端开发</h3><p>从业务系统研发进入基础设施软件与平台交付。</p></div>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="writing">
          <div className={styles.sectionHead}><span>04 / FIELD NOTES</span><h2 id="writing">工程记录</h2></div>
          <div className={styles.articles}>{articles.map(article => (
            <a href={article.slug === 'kylin-ebpf-tracing' ? '/posts/kylin-ebpf-tracing' : `https://docs.jinla.fun/posts/${encodeURIComponent(article.slug)}`} key={article.slug}>
              <div><h3>{article.title}</h3><p>{article.subtitle}</p></div><ArrowUpRight size={20} />
            </a>
          ))}</div>
        </section>

        <footer className={styles.footer}>
          <div><strong>继续了解我的工程实践</strong><p>欢迎交流运维开发、平台工程和可观测性岗位。</p></div>
          <a href="mailto:jlnwcy@gmail.com">jlnwcy@gmail.com <ArrowUpRight size={16} /></a>
          <small>公开脱敏版本 · 已隐去姓名、私人联系方式、公司与客户名称。</small>
        </footer>
      </article>
    </div>
  );
}
