<template>
  <div class="page">
    <!-- ==================== 第一步：上传文件 ==================== -->
    <section class="section">
      <h3>📁 第一步：上传商品文件</h3>
      <div class="upload-area" @click="triggerUpload" @dragover.prevent @drop.prevent="handleDrop">
        <input ref="fileInput" type="file" accept=".xlsx,.xls,.csv" hidden @change="handleFileChange" />
        <div v-if="!fileName" class="upload-placeholder">
          <p>点击或拖拽文件到此处上传</p>
          <p class="tip">支持 .xlsx / .xls / .csv 格式</p>
        </div>
        <div v-else class="upload-info">
          <p>✅ 已上传：<strong>{{ fileName }}</strong></p>
          <button class="btn btn-sm btn-danger" @click.stop="clearFile">清除文件</button>
        </div>
      </div>
    </section>

    <!-- ==================== 第二步：映射商品信息字段 ==================== -->
    <section v-if="headers.length" class="section">
      <h3>🔗 第二步：映射商品信息字段</h3>
      <p class="tip">选择哪些字段组合成「商品信息」（产品详情），系统将以此作为编码匹配的依据</p>
      <div class="field-mapping">
        <div v-for="(field, idx) in mappingFields" :key="idx" class="mapping-row">
          <select v-model="field.source">
            <option value="">-- 请选择字段 --</option>
            <option v-for="h in headers" :key="h" :value="h">{{ h }}</option>
          </select>
          <span v-if="idx < mappingFields.length - 1" class="separator">+</span>
          <button v-if="mappingFields.length < 5" class="btn btn-sm btn-outline" @click="addMappingField" style="margin-left:8px">+ 拼接更多字段</button>
          <button v-if="mappingFields.length > 1" class="btn btn-sm btn-danger" @click="removeMappingField(idx)" style="margin-left:4px">删除</button>
        </div>
        <div class="preview">
          <strong>预览（前3条）：</strong>
          <div v-for="(row, i) in previewRows" :key="i" class="preview-row">
            {{ row }}
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== 第三步：编码规则管理 ==================== -->
    <section v-if="headers.length" class="section">
      <h3>📋 第三步：管理编码规则</h3>

      <!-- 规则表格 -->
      <div class="rule-table-wrapper">
        <table class="rule-table">
          <thead>
            <tr>
              <th style="width:50px">序号</th>
              <th style="width:40%">判断条件</th>
              <th style="width:20%">商品编码</th>
              <th style="width:80px">优先级</th>
              <th style="width:120px">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(rule, idx) in rules" :key="rule.id">
              <td class="center">{{ idx + 1 }}</td>
              <td>{{ formatRuleCondition(rule) }}</td>
              <td><strong>{{ rule.sku }}</strong></td>
              <td class="center">{{ rule.priority }}</td>
              <td class="center">
                <button class="btn btn-sm btn-outline" @click="editRule(idx)">编辑</button>
                <button class="btn btn-sm btn-danger" @click="deleteRule(idx)">删除</button>
              </td>
            </tr>
            <tr v-if="!rules.length">
              <td colspan="5" class="center tip">暂无编码规则，请点击下方按钮添加</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 操作按钮 -->
      <div class="rule-actions">
        <button class="btn btn-primary" @click="openConditionEditor">+ 新建编码条件</button>
      </div>

      <!-- ========== 规则编辑弹窗 ========== -->
      <div v-if="showRuleEditor" class="modal-overlay" @click.self="closeRuleEditor">
        <div class="modal">
          <h4>{{ editingIndex === -1 ? '新建编码条件' : '编辑编码条件' }}</h4>

          <!-- 条件组 -->
          <div class="condition-editor">
            <div v-for="(cond, cIdx) in ruleForm.conditions" :key="cIdx" class="condition-row">
              <select v-model="cond.type">
                <option value="include">包含关键词</option>
                <option value="exclude">不包含关键词</option>
                <option value="color">颜色匹配</option>
                <option value="model">型号匹配</option>
              </select>

              <input v-model="cond.value" :placeholder="placeholderText" />

              <button class="btn btn-sm btn-danger" @click="removeCondition(cIdx)">×</button>

              <div class="cond-tip">
                <template v-if="cond.type === 'include'">✅ 商品信息中必须包含以上任一关键词</template>
                <template v-else-if="cond.type === 'exclude'">🚫 商品信息中包含这些词 → 该规则不匹配（用于区分"非AI款"等）</template>
                <template v-else-if="cond.type === 'color'">🎨 颜色过滤，多个用逗号分隔</template>
                <template v-else-if="cond.type === 'model'">📐 型号/规格过滤，多个用逗号分隔</template>
              </div>
            </div>

            <button class="btn btn-sm btn-outline" @click="addCondition">+ 添加条件</button>
          </div>

          <!-- 商品编码 -->
          <div class="form-item">
            <label>商品编码（SKU）</label>
            <input v-model="ruleForm.sku" placeholder="如：SP01123" />
            <span class="tip">匹配成功后，将把该编码写入商品信息中</span>
          </div>

          <!-- 优先级 -->
          <div class="form-item">
            <label>优先级（数字越小越先匹配）</label>
            <input type="number" v-model.number="ruleForm.priority" />
            <span class="tip">如：AI款耳机优先级 10，普通款耳机优先级 20</span>
          </div>

          <!-- 示例 -->
          <div class="example-box">
            <strong>📌 示例：如何表达"非AI款耳机"</strong>
            <div class="example-content">
              <div>条件1：包含关键词 → <code>耳机</code></div>
              <div>条件2：不包含关键词 → <code>AI</code></div>
              <div>商品编码：<code>SP01121</code></div>
              <div class="example-note">💡 系统会先检查"包含耳机"，再排除"含AI"的商品</div>
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn btn-outline" @click="closeRuleEditor">取消</button>
            <button class="btn btn-primary" @click="saveRule">保存</button>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== 第四步：匹配 & 导出 ==================== -->
    <section v-if="headers.length && rules.length" class="section">
      <h3>🚀 第四步：执行编码匹配</h3>

      <button class="btn btn-primary btn-lg" @click="runMatch" :disabled="matching">
        {{ matching ? '正在匹配...' : '开始匹配并生成文件' }}
      </button>

      <div v-if="matchResult" class="match-result">
        <div class="result-summary">
          <div class="result-item">
            <span class="label">总商品数</span>
            <span class="value">{{ matchResult.total }}</span>
          </div>
          <div class="result-item success">
            <span class="label">匹配成功</span>
            <span class="value">{{ matchResult.matched }}</span>
          </div>
          <div class="result-item warning">
            <span class="label">未匹配</span>
            <span class="value">{{ matchResult.unmatched }}</span>
          </div>
        </div>

        <div v-if="matchResult.unmatchedItems.length" class="unmatched-list">
          <strong>⚠️ 未匹配商品（建议新建规则覆盖）：</strong>
          <div v-for="(item, i) in matchResult.unmatchedItems" :key="i" class="unmatched-item">
            {{ item }}
          </div>
        </div>
      </div>

      <!-- 下载 -->
      <div v-if="downloadUrl" class="download-area">
        <a :href="downloadUrl" :download="downloadFileName" class="btn btn-success btn-lg">
          ⬇️ 下载编码结果文件
        </a>
        <p class="tip">文件已新增「产品详情」「匹配编码」「匹配状态」三列</p>
      </div>
    </section>

    <!-- 空状态提示 -->
    <section v-if="!headers.length" class="section empty-state">
      <p>请先上传商品文件开始操作</p>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import * as XLSX from 'xlsx'

// ==================== 响应式数据 ====================
const fileInput = ref(null)
const fileName = ref('')
const headers = ref([])
const rawData = ref([])
const mappingFields = reactive([{ source: '' }, { source: '' }])
const rules = reactive([])
const showRuleEditor = ref(false)
const editingIndex = ref(-1)
const matching = ref(false)
const matchResult = ref(null)
const downloadUrl = ref('')
const downloadFileName = ref('')

let nextRuleId = 1

// 规则表单
const ruleForm = reactive({
  conditions: [{ type: 'include', value: '' }],
  sku: '',
  priority: 100
})

// 在 <script setup> 中定义计算属性或方法
const placeholderText = computed(() => {
  if (cond.value.type === 'exclude') {
    return `如：AI（表达"没有这个特征"）`;
  } else {
    return '请输入关键词';
  }
});

// ==================== 文件上传 ====================
function triggerUpload() {
  fileInput.value.click()
}

function handleFileChange(e) {
  const file = e.target.files[0]
  if (file) loadFile(file)
}

function handleDrop(e) {
  const file = e.dataTransfer.files[0]
  if (file) loadFile(file)
}

function loadFile(file) {
  fileName.value = file.name
  const reader = new FileReader()
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result)
    const workbook = XLSX.read(data, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 })
    headers.value = jsonData[0] || []
    rawData.value = jsonData.slice(1).map((row, idx) => {
      const obj = { _rowIndex: idx + 2 }
      headers.value.forEach((h, i) => {
        obj[h] = row[i] ?? ''
      })
      return obj
    })
  }
  reader.readAsArrayBuffer(file)
}

function clearFile() {
  fileName.value = ''
  headers.value = []
  rawData.value = []
  mappingFields.splice(0, mappingFields.length, { source: '' }, { source: '' })
  matchResult.value = null
  downloadUrl.value = ''
}

// ==================== 字段映射 ====================
function addMappingField() {
  mappingFields.push({ source: '' })
}

function removeMappingField(idx) {
  mappingFields.splice(idx, 1)
}

const previewRows = computed(() => {
  if (!rawData.value.length) return []
  return rawData.value.slice(0, 3).map(row => buildProductDetail(row))
})

function buildProductDetail(row) {
  return mappingFields
    .filter(f => f.source)
    .map(f => String(row[f.source] ?? '').trim())
    .filter(Boolean)
    .join(' ')
}

// ==================== 规则管理 ====================
function openConditionEditor() {
  // 重置表单
  ruleForm.conditions = [{ type: 'include', value: '' }]
  ruleForm.sku = ''
  ruleForm.priority = rules.length ? Math.max(...rules.map(r => r.priority)) + 10 : 10
  editingIndex.value = -1
  showRuleEditor.value = true
}

function editRule(idx) {
  const rule = rules[idx]
  ruleForm.conditions = rule.conditions.map(c => ({ ...c }))
  ruleForm.sku = rule.sku
  ruleForm.priority = rule.priority
  editingIndex.value = idx
  showRuleEditor.value = true
}

function closeRuleEditor() {
  showRuleEditor.value = false
}

function addCondition() {
  ruleForm.conditions.push({ type: 'include', value: '' })
}

function removeCondition(idx) {
  ruleForm.conditions.splice(idx, 1)
}

function saveRule() {
  // 校验
  if (!ruleForm.sku.trim()) {
    alert('请输入商品编码')
    return
  }
  if (ruleForm.conditions.some(c => !c.value.trim())) {
    alert('请填写所有条件的关键词')
    return
  }

  const conditions = ruleForm.conditions.map(c => ({
    type: c.type,
    value: c.value.split(/[,，]/).map(v => v.trim()).filter(Boolean)
  }))

  const newRule = {
    id: nextRuleId++,
    conditions,
    sku: ruleForm.sku.trim(),
    priority: ruleForm.priority
  }

  if (editingIndex.value >= 0) {
    rules[editingIndex.value] = newRule
  } else {
    rules.push(newRule)
  }

  // 按优先级排序
  rules.sort((a, b) => a.priority - b.priority)
  closeRuleEditor()
}

function deleteRule(idx) {
  if (confirm('确定删除该编码条件吗？')) {
    rules.splice(idx, 1)
  }
}

function formatRuleCondition(rule) {
  return rule.conditions.map(c => {
    const label = { include: '包含', exclude: '不包含', color: '颜色', model: '型号' }[c.type]
    return `${label}「${c.value.join('/')}」`
  }).join(' 且 ')
}

// ==================== 匹配 & 导出 ====================
function runMatch() {
  if (!mappingFields.some(f => f.source)) {
    alert('请先映射商品信息字段')
    return
  }
  if (!rules.length) {
    alert('请先添加编码规则')
    return
  }

  matching.value = true
  matchResult.value = null
  downloadUrl.value = ''

  // 构建产品详情并匹配
  const results = rawData.value.map(row => {
    const detail = buildProductDetail(row)
    const matchedRule = findMatchingRule(detail)
    return {
      ...row,
      productDetail: detail,
      matchSku: matchedRule ? matchedRule.sku : '',
      matchStatus: matchedRule ? '匹配成功' : '未匹配'
    }
  })

  const matched = results.filter(r => r.matchSku).length
  const unmatched = results.length - matched
  const unmatchedItems = results.filter(r => !r.matchSku).map(r => r.productDetail)

  matchResult.value = {
    total: results.length,
    matched,
    unmatched,
    unmatchedItems
  }

  // 生成导出文件
  generateExportFile(results)
  matching.value = false
}

function findMatchingRule(detail) {
  const text = detail.toLowerCase()
  for (const rule of rules) {
    const passed = rule.conditions.every(cond => {
      const keywords = cond.value.map(k => k.toLowerCase())
      if (cond.type === 'include') {
        return keywords.some(k => text.includes(k))
      } else if (cond.type === 'exclude') {
        return !keywords.some(k => text.includes(k))
      } else if (cond.type === 'color') {
        return keywords.some(k => text.includes(k))
      } else if (cond.type === 'model') {
        return keywords.some(k => text.includes(k))
      }
      return true
    })
    if (passed) return rule
  }
  return null
}

function generateExportFile(results) {
  const exportHeaders = [...headers.value, '产品详情', '匹配编码', '匹配状态']
  const data = results.map(row => {
    const arr = []
    headers.value.forEach(h => arr.push(row[h] ?? ''))
    arr.push(row.productDetail, row.matchSku, row.matchStatus)
    return arr
  })

  const ws = XLSX.utils.aoa_to_sheet([exportHeaders, ...data])

  // 设置列宽
  ws['!cols'] = exportHeaders.map((h, i) => ({
    wch: i >= headers.value.length ? 20 : 15
  }))

  // 表头样式
  const headerRange = XLSX.utils.decode_range(ws['!ref'])
  for (let C = headerRange.s.c; C <= headerRange.e.c; C++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c: C })]
    if (cell) {
      cell.s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '4472C4' } },
        alignment: { horizontal: 'center' }
      }
    }
  }

  // 匹配状态列样式
  const statusCol = exportHeaders.indexOf('匹配状态')
  for (let R = 1; R <= data.length; R++) {
    const cell = ws[XLSX.utils.encode_cell({ r: R, c: statusCol })]
    if (cell) {
      cell.s = cell.v === '匹配成功'
        ? { font: { color: { rgb: '008000' }, bold: true } }
        : { font: { color: { rgb: 'FF0000' }, bold: true } }
    }
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '商品编码结果')
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })

  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  downloadUrl.value = URL.createObjectURL(blob)
  downloadFileName.value = fileName.value.replace(/\.[^/.]+$/, '') + '_已编码.xlsx'
}
</script>

<style scoped>
.page {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  max-width: 1100px;
  margin: 0 auto;
}

.section {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #eee;
}

.section:last-child {
  border-bottom: none;
}

h3 {
  margin: 0 0 12px 0;
  font-size: 18px;
}

h4 {
  margin: 0 0 16px 0;
}

.tip {
  font-size: 12px;
  color: #888;
  margin-top: 4px;
}

.empty-state {
  text-align: center;
  color: #999;
  padding: 48px 0;
}

/* 上传区域 */
.upload-area {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s;
}

.upload-area:hover {
  border-color: #4472C4;
}

.upload-placeholder p {
  margin: 4px 0;
  color: #666;
}

.upload-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

/* 字段映射 */
.field-mapping {
  margin-top: 12px;
}

.mapping-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.mapping-row select {
  padding: 6px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  min-width: 200px;
}

.separator {
  font-weight: bold;
  font-size: 18px;
  color: #666;
}

.preview {
  margin-top: 12px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 6px;
}

.preview-row {
  padding: 4px 0;
  font-family: monospace;
  font-size: 13px;
}

/* 规则表格 */
.rule-table-wrapper {
  overflow-x: auto;
}

.rule-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.rule-table th,
.rule-table td {
  border: 1px solid #ddd;
  padding: 10px 12px;
  text-align: left;
}

.rule-table th {
  background: #f0f4f8;
  font-weight: 600;
}

.center {
  text-align: center;
}

.rule-actions {
  margin-top: 12px;
}

/* 条件编辑器 */
.condition-editor {
  margin-bottom: 16px;
}

.condition-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.condition-row select {
  padding: 6px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.condition-row input {
  flex: 1;
  min-width: 250px;
  padding: 6px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.cond-tip {
  width: 100%;
  font-size: 12px;
  color: #666;
  margin-top: 2px;
  padding-left: 4px;
}

.example-box {
  background: #f0f7ff;
  border: 1px solid #b3d4fc;
  border-radius: 6px;
  padding: 12px;
  margin-top: 16px;
}

.example-content {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.8;
}

.example-content code {
  background: #e8e8e8;
  padding: 1px 6px;
  border-radius: 3px;
  font-family: monospace;
}

.example-note {
  color: #4472C4;
  font-weight: 500;
  margin-top: 4px;
}

/* 按钮 */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: opacity 0.2s;
}

.btn:hover {
  opacity: 0.85;
}

.btn-primary {
  background: #4472C4;
  color: #fff;
}

.btn-success {
  background: #28a745;
  color: #fff;
}

.btn-danger {
  background: #dc3545;
  color: #fff;
  padding: 4px 10px;
  font-size: 12px;
}

.btn-outline {
  background: #fff;
  border: 1px solid #ccc;
  color: #333;
}

.btn-sm {
  padding: 4px 10px;
  font-size: 12px;
}

.btn-lg {
  padding: 12px 28px;
  font-size: 16px;
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #fff;
  border-radius: 10px;
  padding: 24px;
  width: 600px;
  max-width: 90vw;
  max-height: 85vh;
  overflow-y: auto;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}

/* 表单 */
.form-item {
  margin-bottom: 16px;
}

.form-item label {
  display: block;
  font-weight: 500;
  margin-bottom: 4px;
}

.form-item input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

/* 匹配结果 */
.match-result {
  margin-top: 16px;
}

.result-summary {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
}

.result-item {
  text-align: center;
  padding: 12px 24px;
  border-radius: 8px;
  background: #f5f5f5;
}

.result-item .label {
  display: block;
  font-size: 12px;
  color: #666;
}

.result-item .value {
  display: block;
  font-size: 28px;
  font-weight: 700;
}

.result-item.success .value {
  color: #28a745;
}

.result-item.warning .value {
  color: #dc3545;
}

.unmatched-list {
  background: #fff8f0;
  border: 1px solid #ffd8b0;
  border-radius: 6px;
  padding: 12px;
  margin-top: 12px;
  max-height: 200px;
  overflow-y: auto;
}

.unmatched-item {
  padding: 3px 0;
  font-size: 13px;
  font-family: monospace;
}

.download-area {
  margin-top: 20px;
  text-align: center;
}
</style>
