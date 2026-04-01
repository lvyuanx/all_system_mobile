<script setup>
const highlights = [
  { title: '一体化流程', desc: '统一订单、版式、人员与站点信息，减少多系统切换。' },
  { title: '移动优先', desc: '关键操作尽量一屏完成，常用信息随手可查。' },
  { title: '可追溯', desc: '操作节点清晰记录，方便复盘与优化流程。' },
]
</script>

<template>
  <div class="about-page">
    <section class="hero">
      <div class="hero-badge">ORDER MANAGEMENT</div>
      <h1 class="hero-title">关于我们</h1>
      <p class="hero-desc">
        我们专注于让门店与团队协作更顺畅，把复杂流程做成简单体验。
      </p>
      <div class="hero-stats">
        <div class="stat-card">
          <div class="stat-num">7x24</div>
          <div class="stat-label">系统可用</div>
        </div>
        <div class="stat-card">
          <div class="stat-num">99.9%</div>
          <div class="stat-label">稳定运行</div>
        </div>
        <div class="stat-card">
          <div class="stat-num">多端</div>
          <div class="stat-label">一致体验</div>
        </div>
      </div>
    </section>

    <section class="panel">
      <h2 class="panel-title">我们的理念</h2>
      <div class="panel-grid">
        <div v-for="item in highlights" :key="item.title" class="panel-item">
          <div class="panel-dot"></div>
          <div class="panel-text">
            <div class="panel-heading">{{ item.title }}</div>
            <div class="panel-desc">{{ item.desc }}</div>
          </div>
        </div>
      </div>
    </section>

    <section class="panel contact">
      <h2 class="panel-title">联系与支持</h2>
      <div class="contact-card">
        <div class="contact-row">
          <span class="contact-label">服务时间</span>
          <span class="contact-value">周一至周日 09:00 - 21:00</span>
        </div>
        <div class="contact-row">
          <span class="contact-label">支持邮箱</span>
          <span class="contact-value">support@example.com</span>
        </div>
        <div class="contact-row">
          <span class="contact-label">版本信息</span>
          <span class="contact-value">Mobile App v2.3.0</span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.about-page {
  min-height: 100%;
  background: #f5f6fb;
  padding-bottom: 32px;
}

.hero {
  position: relative;
  padding: 36px 20px 24px;
  background: radial-gradient(circle at 20% 0%, rgba(255, 214, 165, 0.5) 0%, rgba(255, 214, 165, 0) 45%),
    radial-gradient(circle at 80% 10%, rgba(140, 196, 255, 0.55) 0%, rgba(140, 196, 255, 0) 50%),
    linear-gradient(160deg, #ffffff 0%, #f2f6ff 70%, #eef2ff 100%);
  border-radius: 0 0 28px 28px;
  box-shadow: 0 10px 30px rgba(49, 76, 135, 0.12);
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.12);
  color: #16a34a;
  font-size: 11px;
  letter-spacing: 1.2px;
  font-weight: 600;
}

.hero-title {
  margin: 14px 0 6px;
  font-size: 26px;
  font-weight: 800;
  color: #1f2a44;
  letter-spacing: 1px;
}

.hero-desc {
  margin: 0 0 20px;
  font-size: 13px;
  color: rgba(31, 42, 68, 0.72);
  line-height: 1.6;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.stat-card {
  padding: 12px 8px;
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 6px 16px rgba(31, 42, 68, 0.08);
  text-align: center;
}

.stat-num {
  font-size: 16px;
  font-weight: 700;
  color: #1f2a44;
}

.stat-label {
  font-size: 11px;
  color: rgba(31, 42, 68, 0.55);
  margin-top: 4px;
}

.panel {
  margin: 16px 16px 0;
  padding: 16px;
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 8px 24px rgba(31, 42, 68, 0.08);
}

.panel-title {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 700;
  color: #1f2a44;
}

.panel-grid {
  display: grid;
  gap: 12px;
}

.panel-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  background: #f7f9ff;
  border-radius: 14px;
}

.panel-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #22c55e);
  margin-top: 4px;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
}

.panel-heading {
  font-size: 13px;
  font-weight: 700;
  color: #1f2a44;
}

.panel-desc {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(31, 42, 68, 0.66);
  line-height: 1.5;
}

.contact-card {
  display: grid;
  gap: 10px;
  padding: 12px;
  border-radius: 14px;
  background: #f9fafc;
  border: 1px solid rgba(31, 42, 68, 0.06);
}

.contact-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
}

.contact-label {
  color: rgba(31, 42, 68, 0.55);
}

.contact-value {
  color: #1f2a44;
  font-weight: 600;
}
</style>
