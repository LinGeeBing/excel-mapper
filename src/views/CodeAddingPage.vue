<template>
  <div class="product-code-page">
    <!-- ===== 模块一：上传文件 ===== -->
    <el-card shadow="never" class="upload-card">
      <div class="card-header">
        <el-button type="primary" @click="openUploadDialog" :disabled="hasUploadedFile">
          上传文件
        </el-button>
      </div>

      <div v-if="hasUploadedFile" class="uploaded-file-area">
        <div class="file-item">
          <div class="file-icon">
            <el-icon><Document /></el-icon>
          </div>
          <div class="file-name">{{ fileName }}</div>
          <div class="file-actions">
            <el-icon class="delete-btn" @click="handleDeleteConfirm">
              <Close />
            </el-icon>
            <el-button type="primary" link size="small" @click="previewFile">
              预览
            </el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- ===== 模块二：商品信息定义 ===== -->
    <el-card shadow="never" style="margin-top: 20px;">
      <template #header>
        <span>📦 定义商品信息</span>
      </template>

      <div style="margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <span style="font-weight: 500;">选择参与字段：</span>
          <el-select
            v-model="selectedField"
            placeholder="请选择字段"
            style="width: 220px;"
            clearable
            filterable
            @change="addField"
          >
            <el-option
              v-for="h in availableFields"
              :key="h"
              :label="h"
              :value="h"
            />
          </el-select>
        </div>

        <div v-if="selectedFields.length" class="selected-fields">
          <div
            v-for="(field, index) in selectedFields"
            :key="field"
            class="field-tag"
            style="display: inline-flex; align-items: center; gap: 6px; margin: 4px;"
          >
            <el-tag
              type="primary"
              effect="plain"
              style="cursor: grab; user-select: none;"
              :data-field="field"
            >
              {{ index + 1 }}. {{ field }}
            </el-tag>
            <el-icon
              style="cursor: pointer; color: #f56c6c;"
              @click="removeField(index)"
            >
              <Close />
            </el-icon>
          </div>
        </div>

        <div v-else style="color: #c0c4cc; font-size: 13px;">
          请至少选择一个字段
        </div>
      </div>

      <div style="display: flex; gap: 12px;">
        <el-button
          type="primary"
          :disabled="selectedFields.length === 0"
          @click="previewMapping"
        >
          预览商品信息
        </el-button>
        <el-button
          type="success"
          :disabled="selectedFields.length === 0"
          @click="confirmMapping"
        >
          确认定义
        </el-button>
      </div>
    </el-card>

    <!-- ===== 模块三：商品编码表 ===== -->
    <el-card shadow="never" style="margin-top: 20px;">
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span>🏷️ 商品编码表</span>
          <el-button type="primary" size="large" @click="openCreateCodeDialog">
            新建商品编码
          </el-button>
        </div>
      </template>

      <div style="margin-bottom: 16px;">
        <el-input
          v-model="codeSearchKeyword"
          placeholder="搜索商品编号"
          clearable
          style="width: 300px;"
          @input="filterCodeTable"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <el-table
        :data="filteredCodeRules"
        border
        style="width: 100%;"
        row-key="id"
      >
        <el-table-column label="序号" width="70" align="center">
          <template #default="{ $index }">
            {{ $index + 1 }}
          </template>
        </el-table-column>

        <el-table-column label="商品编号" prop="code" width="150">
          <template #default="{ row }">
            <el-tag type="primary" effect="plain">{{ row.code }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="编码条件" min-width="400">
          <template #default="{ row }">
            <div v-html="formatCondition(row)" />
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="editCodeRule(row)">
              编辑
            </el-button>
            <el-button type="warning" size="small" @click="duplicateCodeRule(row)">
              复制
            </el-button>
            <el-button type="danger" size="small" @click="deleteCodeRule(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- ===== 模块四：添加编码 ===== -->
    <el-card shadow="never" style="margin-top: 20px;">
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span>📝 添加编码</span>
          <el-button
            type="primary"
            :disabled="!canAddCode"
            @click="startAddCode"
          >
            添加编码
          </el-button>
        </div>
      </template>

      <div v-if="matchSummary" style="margin-bottom: 16px;">
        <el-alert
          :type="matchSummary.hasError ? 'warning' : 'success'"
          :closable="false"
          show-icon
        >
          <template #title>
            <span>编码匹配完成</span>
          </template>
          <div style="font-size: 13px; line-height: 1.8;">
            <div>总计：{{ matchSummary.total }} 条</div>
            <div style="color: #67c23a;">✅ 成功匹配：{{ matchSummary.matched }} 条</div>
            <div v-if="matchSummary.unmatched > 0" style="color: #e6a23c;">
              ⚠️ 未匹配：{{ matchSummary.unmatched }} 条
            </div>
            <div v-if="matchSummary.duplicated > 0" style="color: #f56c6c;">
              ❗ 重复命中：{{ matchSummary.duplicated }} 条
            </div>
          </div>
        </el-alert>
      </div>

      <div v-if="matchResults.length" style="margin-bottom: 12px; display: flex; gap: 12px; align-items: center;">
        <el-button-group>
          <el-button
            :type="resultFilter === 'all' ? 'primary' : ''"
            size="small"
            @click="resultFilter = 'all'"
          >
            全部 ({{ matchResults.length }})
          </el-button>
          <el-button
            :type="resultFilter === 'matched' ? 'success' : ''"
            size="small"
            @click="resultFilter = 'matched'"
          >
            已匹配 ({{ matchedCount }})
          </el-button>
          <el-button
            :type="resultFilter === 'unmatched' ? 'warning' : ''"
            size="small"
            @click="resultFilter = 'unmatched'"
          >
            未匹配 ({{ unmatchedCount }})
          </el-button>
          <el-button
            :type="resultFilter === 'duplicated' ? 'danger' : ''"
            size="small"
            @click="resultFilter = 'duplicated'"
          >
            重复命中 ({{ duplicatedCount }})
          </el-button>
        </el-button-group>

        <el-button
          type="success"
          size="small"
          @click="exportResults"
        >
          导出结果
        </el-button>
      </div>

      <el-table
        v-if="filteredResults.length"
        :data="filteredResults"
        border
        style="width: 100%;"
        height="450"
        row-key="rowNo"
      >
        <el-table-column label="序号" width="70" align="center">
          <template #default="{ row }">
            {{ row.rowNo }}
          </template>
        </el-table-column>

        <el-table-column
          v-for="(field, index) in selectedFields"
          :key="index"
          :label="field"
          width="150"
        >
          <template #default="{ row }">
            {{ row.fieldValues[field] }}
          </template>
        </el-table-column>

        <el-table-column label="商品信息" min-width="200">
          <template #default="{ row }">
            {{ row.productInfo }}
          </template>
        </el-table-column>

        <el-table-column label="编码状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag
              v-if="row.matched"
              type="success"
              size="small"
            >
              已匹配
            </el-tag>
            <el-tag
              v-else
              type="warning"
              size="small"
            >
              未匹配
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="商品编码" min-width="150">
          <template #default="{ row }">
            <template v-if="row.matched">
              <el-tag
                v-for="(code, idx) in row.codes"
                :key="idx"
                :type="row.codes.length > 1 ? 'danger' : 'primary'"
                effect="plain"
                style="margin: 2px;"
              >
                {{ code }}
              </el-tag>
            </template>
            <span v-else style="color: #e6a23c;">未命中</span>
          </template>
        </el-table-column>

        <el-table-column label="异常信息" min-width="200">
          <template #default="{ row }">
            <span v-if="row.duplicated" style="color: #f56c6c;">
              重复命中：{{ row.codes.join('、') }}
            </span>
            <span v-else-if="!row.matched" style="color: #e6a23c;">
              {{ row.reason }}
            </span>
            <span v-else style="color: #67c23a;">正常</span>
          </template>
        </el-table-column>
      </el-table>

      <el-empty
        v-if="!matchResults.length && !matchSummary"
        description="请先上传文件、定义商品信息、配置编码表"
      />
    </el-card>

    <!-- ===== 上传文件弹窗 ===== -->
    <el-dialog v-model="uploadVisible" title="上传商品原表" width="500px">
      <el-form label-width="80px">
        <el-form-item label="上传文件">
          <el-upload
            ref="uploadRef"
            class="file-uploader"
            drag
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            accept=".xlsx,.xls,.csv"
            :limit="1"
            :on-exceed="handleExceed"
          >
            <el-icon size="40"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或 <em>点击选择</em>
            </div>
            <template #file="{ file }">
              <div class="upload-file-preview">
                <div class="file-info">
                  <el-icon><Document /></el-icon>
                  <span>{{ file.name }}</span>
                </div>
                <div class="file-actions">
                  <el-icon style="cursor: pointer;" @click="removeFile">
                    <Close />
                  </el-icon>
                  <el-button type="primary" link size="small" @click="previewFile">
                    预览
                  </el-button>
                </div>
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="uploadVisible = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="!rawRows.length"
          @click="confirmUpload"
        >
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- ===== 文件预览弹窗 ===== -->
    <el-dialog v-model="previewVisible" title="文件预览" width="900px">
      <el-table
        :data="previewRows"
        border
        height="500"
        style="width: 100%;"
      >
        <el-table-column
          label="序号"
          width="70"
          align="center"
          fixed="left"
        >
          <template #default="{ $index }">
            {{ $index + 1 }}
          </template>
        </el-table-column>

        <el-table-column
          v-for="(col, index) in previewHeaders"
          :key="index"
          :label="col || `列${index + 1}`"
        >
          <template #default="{ row }">
            {{ row[index] }}
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <el-button @click="previewVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- ===== 商品信息预览弹窗 ===== -->
    <el-dialog v-model="mappingPreviewVisible" title="商品信息预览" width="900px">
      <div style="margin-bottom: 12px; color: #909399; font-size: 13px;">
        拼接规则：{{ selectedFields.join(' + ') }}
      </div>

      <el-table
        :data="mappingPreviewRows"
        border
        height="450"
        style="width: 100%;"
      >
        <el-table-column
          label="序号"
          width="70"
          align="center"
          fixed="left"
        >
          <template #default="{ row }">
            {{ row.__rowNo }}
          </template>
        </el-table-column>

        <el-table-column
          v-for="(field, index) in selectedFields"
          :key="index"
          :label="field"
          width="180"
        >
          <template #default="{ row }">
            {{ row[field] }}
          </template>
        </el-table-column>
        <el-table-column label="商品信息" min-width="250">
          <template #default="{ row }">
            {{ row.__productInfo }}
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <el-button @click="mappingPreviewVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- ===== 新建/编辑商品编码弹窗 ===== -->
    <el-dialog
      v-model="codeDialogVisible"
      :title="isEditing ? '编辑商品编码' : '新建商品编码'"
      width="900px"
      @close="cancelCodeDialog"
    >
      <div style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
          <span style="font-weight: 500; white-space: nowrap;">商品编码：</span>
          <el-input
            v-model="codeForm.code"
            placeholder="请输入商品编码"
            style="width: 250px;"
            ref="codeInputRef"
          />
        </div>

        <!-- 品类条件区 -->
        <div style="margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="font-weight: 600; color: #303133;">品类</span>
            <el-icon
              style="cursor: pointer; color: #409EFF; font-size: 18px;"
              @click="addCategoryGroup"
            >
              <Plus />
            </el-icon>
          </div>

          <div
            v-for="(group, gIdx) in codeForm.categoryGroups"
            :key="gIdx"
            class="condition-group"
          >
            <!-- ✅ 去掉 AND 文字，逻辑保留 -->
            <div class="condition-group-box">
              <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 6px;">
                <div
                  v-for="(val, vIdx) in group.orValues"
                  :key="vIdx"
                  style="display: flex; align-items: center; gap: 4px;"
                >
                  <el-input
                    v-if="val.isEditing"
                    v-model="val.text"
                    size="small"
                    style="min-width: 200px;"
                    placeholder="输入条件"
                    @blur="onInputBlur(val, group.orValues, vIdx === 0)"
                    @keyup.enter="onInputConfirm(val, group.orValues, vIdx === 0)"
                    :ref="el => setInputRef(el, gIdx, vIdx)"
                  />
                  <template v-else>
                    <el-tag
                      type="info"
                      effect="plain"
                      style="cursor: pointer;"
                      @click="editInput(val, group.orValues, vIdx, $event)"
                    >
                      {{ val.text }}
                    </el-tag>
                  </template>
                  <el-icon
                    v-if="vIdx > 0"
                    style="cursor: pointer; color: #f56c6c; font-size: 13px;"
                    @click="removeOrValue(group.orValues, vIdx)"
                  >
                    <Close />
                  </el-icon>
                </div>
                <el-icon
                  style="cursor: pointer; color: #409EFF; font-size: 16px;"
                  @click="addOrValue(group.orValues, gIdx)"
                >
                  <Plus />
                </el-icon>
              </div>
              <!-- ✅ 去掉 OR 标签 -->
            </div>
          </div>
        </div>

        <!-- 规格条件区 -->
        <div style="margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="font-weight: 600; color: #303133;">规格</span>
            <el-icon
              style="cursor: pointer; color: #409EFF; font-size: 18px;"
              @click="addSpecGroup"
            >
              <Plus />
            </el-icon>
          </div>

          <div
            v-for="(group, gIdx) in codeForm.specGroups"
            :key="gIdx"
            class="condition-group"
          >
            <!-- ✅ 去掉 AND 文字 -->
            <div class="condition-group-box">
              <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 6px;">
                <div
                  v-for="(val, vIdx) in group.orValues"
                  :key="vIdx"
                  style="display: flex; align-items: center; gap: 4px;"
                >
                  <el-input
                    v-if="val.isEditing"
                    v-model="val.text"
                    size="small"
                    style="min-width: 200px;"
                    placeholder="输入条件"
                    @blur="onInputBlur(val, group.orValues, vIdx === 0)"
                    @keyup.enter="onInputConfirm(val, group.orValues, vIdx === 0)"
                    :ref="el => setInputRef(el, gIdx, vIdx)"
                  />
                  <template v-else>
                    <el-tag
                      type="info"
                      effect="plain"
                      style="cursor: pointer;"
                      @click="editInput(val, group.orValues, vIdx, $event)"
                    >
                      {{ val.text }}
                    </el-tag>
                  </template>
                  <el-icon
                    v-if="vIdx > 0"
                    style="cursor: pointer; color: #f56c6c; font-size: 13px;"
                    @click="removeOrValue(group.orValues, vIdx)"
                  >
                    <Close />
                  </el-icon>
                </div>
                <el-icon
                  style="cursor: pointer; color: #409EFF; font-size: 16px;"
                  @click="addOrValue(group.orValues, gIdx)"
                >
                  <Plus />
                </el-icon>
              </div>
              <!-- ✅ 去掉 OR 标签 -->
            </div>
          </div>
        </div>

        <!-- 关键词条件区 -->
        <div style="margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="font-weight: 600; color: #303133;">关键词</span>
            <el-icon
              style="cursor: pointer; color: #409EFF; font-size: 18px;"
              @click="addKeywordGroup"
            >
              <Plus />
            </el-icon>
          </div>

          <div
            v-for="(group, gIdx) in codeForm.keywordGroups"
            :key="gIdx"
            class="condition-group"
          >
            <!-- ✅ 去掉 AND 文字 -->
            <div class="condition-group-box">
              <!-- 含/不含 选择框 -->
              <el-select
                v-model="group.negate"
                size="small"
                style="width: 120px; margin-right: 8px;"
              >
                <el-option :value="false" label="含关键词" />
                <el-option :value="true" label="不含关键词" />
              </el-select>

              <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 6px;">
                <div
                  v-for="(val, vIdx) in group.orValues"
                  :key="vIdx"
                  style="display: flex; align-items: center; gap: 4px;"
                >
                  <el-input
                    v-if="val.isEditing"
                    v-model="val.text"
                    size="small"
                    style="width: 200px;"
                    placeholder="输入条件"
                    @blur="onInputBlur(val, group.orValues, vIdx === 0)"
                    @keyup.enter="onInputConfirm(val, group.orValues, vIdx === 0)"
                    :ref="el => setInputRef(el, gIdx, vIdx)"
                  />
                  <template v-else>
                    <el-tag
                      type="info"
                      effect="plain"
                      style="cursor: pointer;"
                      @click="editInput(val, group.orValues, vIdx, $event)"
                    >
                      {{ val.text }}
                    </el-tag>
                  </template>
                  <el-icon
                    v-if="vIdx > 0"
                    style="cursor: pointer; color: #f56c6c; font-size: 13px;"
                    @click="removeOrValue(group.orValues, vIdx)"
                  >
                    <Close />
                  </el-icon>
                </div>
                <el-icon
                  style="cursor: pointer; color: #409EFF; font-size: 16px;"
                  @click="addOrValue(group.orValues, gIdx)"
                >
                  <Plus />
                </el-icon>
              </div>
              <!-- ✅ 去掉 OR 标签 -->
            </div>
          </div>
        </div>

        <!-- ✅ 左下角提示文字 -->
        <div style="font-size: 12px; color: #67c23a; margin-top: 8px;">
          💡 绿色框内条件或，绿色框外条件与
        </div>
      </div>

      <template #footer>
        <el-button @click="cancelCodeDialog">取消</el-button>
        <el-button type="primary" @click="saveCodeRule">
          {{ isEditing ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  UploadFilled, Document, Close, Plus, Search
} from '@element-plus/icons-vue'
import Sortable from 'sortablejs'
import * as XLSX from 'xlsx'

/* ========================================================
   模块一 & 模块二（原有代码，不做任何修改）
   ======================================================== */
const uploadVisible = ref(false)
const previewVisible = ref(false)
const uploadRef = ref(null)

const fileName = ref('')
const rawHeaders = ref([])
const rawRows = ref([])
const previewHeaders = ref([])
const previewRows = ref([])

const hasUploadedFile = computed(
  () => !!fileName.value && rawHeaders.value.length > 0
)

const selectedField = ref('')
const selectedFields = ref([])
const mappingPreviewVisible = ref(false)
const mappingPreviewRows = ref([])

const availableFields = computed(() =>
  rawHeaders.value.filter(h => !selectedFields.value.includes(h))
)

const openUploadDialog = () => {
  uploadVisible.value = true
}

const handleExceed = (files) => {
  uploadRef.value?.clearFiles()
  uploadRef.value?.handleStart(files[0])
}

const handleFileChange = (file) => {
  fileName.value = file.name
  parseFile(file.raw)
}

const parseFile = (file) => {
  const isCSV = file.name.toLowerCase().endsWith('.csv')
  const reader = new FileReader()

  reader.onload = (e) => {
    try {
      let workbook

      if (isCSV) {
        let text = ''
        try {
          text = new TextDecoder('utf-8', { fatal: true }).decode(e.target.result)
        } catch {
          text = new TextDecoder('gbk').decode(e.target.result)
        }
        workbook = XLSX.read(text, { type: 'string' })
      } else {
        workbook = XLSX.read(e.target.result, { type: 'array', dense: true })
      }

      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false })

      if (!aoa.length) {
        ElMessage.warning('文件内容为空')
        return
      }

      // ✅ 过滤全空行
      const filtered = aoa.filter(row =>
        Array.isArray(row) && row.some(cell => cell !== null && cell !== undefined && cell.toString().trim() !== '')
      )

      rawHeaders.value = (filtered[0] || []).map(v => (v == null ? '' : String(v)))
      rawRows.value = filtered.slice(1).map(r => r.map(v => (v == null ? '' : String(v))))

      previewHeaders.value = rawHeaders.value
      previewRows.value = rawRows.value

      ElMessage.success('文件解析成功')
    } catch {
      ElMessage.error('文件解析失败')
    }
  }

  if (isCSV) {
    reader.readAsArrayBuffer(file.slice(0, 1024 * 1024))
  } else {
    reader.readAsArrayBuffer(file)
  }
}

const removeFile = () => {
  uploadRef.value?.clearFiles()
  fileName.value = ''
  rawHeaders.value = []
  rawRows.value = []
  previewHeaders.value = []
  previewRows.value = []
}

const confirmUpload = () => {
  uploadVisible.value = false
  ElMessage.success('文件上传成功')
}

const handleDeleteConfirm = () => {
  ElMessageBox.confirm(
    '确定要删除该文件吗？删除后将无法预览，字段定义也会被清空，如需重新上传请点击下方按钮。',
    '确认删除',
    {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    removeFile()
    clearMapping()
    ElMessage.success('文件已删除')
  })
}

const previewFile = () => {
  if (!rawRows.value.length) {
    ElMessage.warning('暂无文件数据')
    return
  }
  previewVisible.value = true
}

const addField = (field) => {
  if (!field) return
  if (selectedFields.value.includes(field)) {
    ElMessage.warning('该字段已添加')
    selectedField.value = ''
    return
  }
  selectedFields.value.push(field)
  selectedField.value = ''
  enableDrag()
}

const removeField = (index) => {
  selectedFields.value.splice(index, 1)
  nextTick(enableDrag)
}

const clearMapping = () => {
  selectedFields.value = []
  selectedField.value = ''
}

const buildProductInfo = (row) => {
  return selectedFields.value
    .map(fieldName => {
      const colIndex = rawHeaders.value.indexOf(fieldName)
      if (colIndex === -1) return ''
      return (row[colIndex] ?? '').toString().trim()
    })
    .join('')
}

const previewMapping = () => {
  if (selectedFields.value.length === 0) {
    ElMessage.warning('请至少选择一个字段')
    return
  }

  mappingPreviewRows.value = rawRows.value.map((row, rowIndex) => {
    const obj = {
      __rowNo: rowIndex + 1
    }

    selectedFields.value.forEach(field => {
      const colIndex = rawHeaders.value.indexOf(field)
      obj[field] = colIndex >= 0 ? (row[colIndex] ?? '') : ''
    })

    obj.__productInfo = buildProductInfo(row)
    return obj
  })

  mappingPreviewVisible.value = true
}

const confirmMapping = () => {
  if (selectedFields.value.length === 0) {
    ElMessage.warning('请至少选择一个字段')
    return
  }

  rawRows.value.forEach(row => {
    row.__productInfo = buildProductInfo(row)
  })

  ElMessage.success('商品信息定义完成')
}

let sortableInstance = null

const enableDrag = () => {
  nextTick(() => {
    const container = document.querySelector('.selected-fields')
    if (!container) return

    if (sortableInstance) {
      sortableInstance.destroy()
      sortableInstance = null
    }

    sortableInstance = Sortable.create(container, {
      animation: 200,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      draggable: '.field-tag',
      onEnd({ newIndex, oldIndex }) {
        if (newIndex === oldIndex) return
        const item = selectedFields.value.splice(oldIndex, 1)[0]
        selectedFields.value.splice(newIndex, 0, item)
        nextTick(() => {
          enableDrag()
        })
      }
    })
  })
}

/* ========================================================
   模块三：商品编码表（已有功能，不做任何修改）
   ======================================================== */
let ruleIdCounter = 0

const codeRules = ref([])

const codeSearchKeyword = ref('')

const filteredCodeRules = computed(() => {
  if (!codeSearchKeyword.value.trim()) return codeRules.value
  const kw = codeSearchKeyword.value.trim().toLowerCase()
  return codeRules.value.filter(r => r.code.toLowerCase().includes(kw))
})

const codeDialogVisible = ref(false)
const isEditing = ref(false)
const editingRuleId = ref(null)
const codeInputRef = ref(null)

const codeForm = ref({
  code: '',
  categoryGroups: [],
  specGroups: [],
  keywordGroups: []
})

const inputRefs = ref(new Map())

const setInputRef = (el, gIdx, vIdx) => {
  if (el) {
    inputRefs.value.set(`${gIdx}_${vIdx}`, el)
  }
}

const createOrValue = (text = '', isEditing = true) => ({
  text,
  isEditing
})

const focusInput = (gIdx, vIdx) => {
  nextTick(() => {
    const key = `${gIdx}_${vIdx}`
    const el = inputRefs.value.get(key)
    if (el) {
      const input = el.$el?.querySelector('input') || el.querySelector?.('input') || el
      input?.focus()
    }
  })
}

const addCategoryGroup = () => {
  codeForm.value.categoryGroups.push({
    orValues: [createOrValue('', true)]
  })
  focusInput(codeForm.value.categoryGroups.length - 1, 0)
}

const addSpecGroup = () => {
  codeForm.value.specGroups.push({
    orValues: [createOrValue('', true)]
  })
  focusInput(codeForm.value.specGroups.length - 1, 0)
}

const addKeywordGroup = () => {
  codeForm.value.keywordGroups.push({
    negate: false,
    orValues: [createOrValue('', true)]
  })
  focusInput(codeForm.value.keywordGroups.length - 1, 0)
}

const addOrValue = (orValues, gIdx) => {
  orValues.push(createOrValue('', true))
  focusInput(gIdx, orValues.length - 1)
}

const editInput = (val, orValues, isFirst, event) => {
  val.isEditing = true
  nextTick(() => {
    const tag = event.currentTarget
    const box = tag.closest('.condition-group-box') || tag.parentElement
    const input = box?.querySelector('input')
    input?.focus()
  })
}

const onInputConfirm = (val, orValues, isFirst) => {
  if (!val.text.trim()) {
    if (!isFirst) {
      orValues.splice(orValues.indexOf(val), 1)
    }
  }
  val.isEditing = false
}

const onInputBlur = (val, orValues, isFirst) => {
  if (!val.text.trim()) {
    if (!isFirst) {
      orValues.splice(orValues.indexOf(val), 1)
    }
  }
  val.isEditing = false
}

const removeOrValue = (orValues, vIdx) => {
  orValues.splice(vIdx, 1)
}

// ✅ 空大框自动销毁（规格/关键词）
const cleanupEmptyGroup = (groupsType) => {
  if (groupsType === 'category') return // 品类不清理
  codeForm.value[groupsType] = codeForm.value[groupsType].filter(
    g => g.orValues.some(v => (v.text || '').trim())
  )
}

// ✅ 在 onInputBlur 和 removeOrValue 后调用清理
const onInputBlurWithCleanup = (val, orValues, isFirst, groupsType) => {
  onInputBlur(val, orValues, isFirst)
  nextTick(() => cleanupEmptyGroup(groupsType))
}

const removeOrValueWithCleanup = (orValues, vIdx, groupsType) => {
  removeOrValue(orValues, vIdx)
  nextTick(() => cleanupEmptyGroup(groupsType))
}

const collectValues = (groups, fieldName) => {
  const result = []
  for (const g of groups) {
    const values = g.orValues
      .map(v => (v.text || '').trim())
      .filter(Boolean)
    if (values.length > 0) {
      result.push({
        values,
        negate: g.negate || false
      })
    }
  }
  return result
}

const formatCondition = (rule) => {
  const parts = []

  if (rule.categoryGroups?.length) {
    const catStr = rule.categoryGroups
      .map(g => g.values.join(' / '))
      .join(' AND ')
    parts.push(`<b>品类：</b>${catStr}`)
  }

  if (rule.specGroups?.length) {
    const specStr = rule.specGroups
      .map(g => g.values.join(' / '))
      .join(' AND ')
    parts.push(`<b>规格：</b>${specStr}`)
  }

  if (rule.keywordGroups?.length) {
    const kwStr = rule.keywordGroups
      .map(g => {
        const values = g.values.join(' / ')
        return g.negate ? `不含 ${values}` : `含 ${values}`
      })
      .join(' AND ')
    parts.push(`<b>关键词：</b>${kwStr}`)
  }

  return parts.join('<br>')
}

const openCreateCodeDialog = () => {
  isEditing.value = false
  editingRuleId.value = null
  codeForm.value = {
    code: '',
    categoryGroups: [],
    specGroups: [],
    keywordGroups: []
  }
  inputRefs.value.clear()
  codeDialogVisible.value = true
  nextTick(() => {
    addCategoryGroup()
    codeInputRef.value?.focus()
  })
}

const editCodeRule = (row) => {
  isEditing.value = true
  editingRuleId.value = row.id
  inputRefs.value.clear()

  codeForm.value = {
    code: row.code,
    categoryGroups: (row.categoryGroups || []).map(g => ({
      orValues: g.values.map(v => createOrValue(v, false))
    })),
    specGroups: (row.specGroups || []).map(g => ({
      orValues: g.values.map(v => createOrValue(v, false))
    })),
    keywordGroups: (row.keywordGroups || []).map(g => ({
      negate: g.negate || false,
      orValues: g.values.map(v => createOrValue(v, false))
    }))
  }

  codeDialogVisible.value = true
}

const duplicateCodeRule = (row) => {
  const newRule = {
    ...row,
    id: ++ruleIdCounter,
    code: row.code + '_副本',
    categoryGroups: (row.categoryGroups || []).map(g => ({
      values: [...g.values],
      negate: g.negate || false
    })),
    specGroups: (row.specGroups || []).map(g => ({
      values: [...g.values],
      negate: g.negate || false
    })),
    keywordGroups: (row.keywordGroups || []).map(g => ({
      values: [...g.values],
      negate: g.negate || false
    }))
  }
  const idx = codeRules.value.findIndex(r => r.id === row.id)
  codeRules.value.splice(idx + 1, 0, newRule)
  ElMessage.success('复制成功')
}

const deleteCodeRule = (row) => {
  ElMessageBox.confirm(
    `确定要删除编码「${row.code}」吗？`,
    '确认删除',
    {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    codeRules.value = codeRules.value.filter(r => r.id !== row.id)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

const saveCodeRule = () => {
  const form = codeForm.value

  const validCategory = form.categoryGroups
    .map(g => g.orValues.some(v => (v.text || '').trim()))
    .some(Boolean)

  if (!form.code.trim()) {
    ElMessage.warning('请输入商品编码')
    return
  }

  if (!validCategory) {
    ElMessage.warning('品类条件不能为空')
    return
  }

  const categoryGroups = collectValues(form.categoryGroups, '品类')
  const specGroups = collectValues(form.specGroups, '规格')
  const keywordGroups = collectValues(form.keywordGroups, '关键词')

  const payload = {
    code: form.code.trim(),
    categoryGroups,
    specGroups,
    keywordGroups
  }

  if (isEditing.value) {
    const idx = codeRules.value.findIndex(r => r.id === editingRuleId.value)
    if (idx !== -1) {
      codeRules.value[idx] = { ...codeRules.value[idx], ...payload }
    }
    ElMessage.success('编辑成功')
  } else {
    codeRules.value.push({
      id: ++ruleIdCounter,
      ...payload
    })
    ElMessage.success('创建成功')
  }

  codeDialogVisible.value = false
}

const cancelCodeDialog = () => {
  codeDialogVisible.value = false
  isEditing.value = false
  editingRuleId.value = null
  inputRefs.value.clear()
}

const filterCodeTable = () => {
  // 由 computed 自动响应
}

/* ========================================================
   模块四：添加编码（新增功能）
   ======================================================== */

const matchResults = ref([])
const matchSummary = ref(null)
const resultFilter = ref('all')

const canAddCode = computed(() => {
  return selectedFields.value.length > 0
    && rawRows.value.length > 0
    && codeRules.value.length > 0
    && rawRows.value.some(r => r.__productInfo !== undefined)
})

const matchedCount = computed(() =>
  matchResults.value.filter(r => r.matched && !r.duplicated).length
)
const unmatchedCount = computed(() =>
  matchResults.value.filter(r => !r.matched).length
)
const duplicatedCount = computed(() =>
  matchResults.value.filter(r => r.duplicated).length
)

const filteredResults = computed(() => {
  if (resultFilter.value === 'all') return matchResults.value
  if (resultFilter.value === 'matched') return matchResults.value.filter(r => r.matched && !r.duplicated)
  if (resultFilter.value === 'unmatched') return matchResults.value.filter(r => !r.matched)
  if (resultFilter.value === 'duplicated') return matchResults.value.filter(r => r.duplicated)
  return matchResults.value
})

const matchRule = (rule, productInfo) => {
  // 1️⃣ 品类（AND 组）
  for (const group of rule.categoryGroups) {
    const hit = group.values.some(v => productInfo.includes(v))
    if (!hit) return false
  }

  // 2️⃣ 规格（可选）
  if (rule.specGroups.length > 0) {
    for (const group of rule.specGroups) {
      const hit = group.values.some(v => productInfo.includes(v))
      if (!hit) return false
    }
  }

  // 3️⃣ 关键词（可选）
  if (rule.keywordGroups.length > 0) {
    for (const group of rule.keywordGroups) {
      const hit = group.values.some(v => productInfo.includes(v))
      if (group.negate) {
        if (hit) return false
      } else {
        if (!hit) return false
      }
    }
  }

  return true
}

const startAddCode = () => {
  if (!canAddCode.value) {
    ElMessage.warning('请先完成上传文件、定义商品信息、配置编码表')
    return
  }

  const results = []

  for (let i = 0; i < rawRows.value.length; i++) {
    const row = rawRows.value[i]
    const productInfo = row.__productInfo || ''

    if (!productInfo) {
      results.push({
        rowNo: i + 1,
        productInfo: '',
        matched: false,
        codes: [],
        duplicated: false,
        reason: '商品信息为空',
        fieldValues: {}
      })
      continue
    }

    const hitCodes = []

    for (const rule of codeRules.value) {
      try {
        const isMatch = matchRule(rule, productInfo)
        if (isMatch) {
          hitCodes.push(rule.code)
        }
      } catch {
        // 单条规则匹配异常不影响整体
      }
    }

    const fieldValues = {}
    selectedFields.value.forEach(field => {
      const colIndex = rawHeaders.value.indexOf(field)
      fieldValues[field] = colIndex >= 0 ? (row[colIndex] ?? '') : ''
    })

    if (hitCodes.length === 0) {
      results.push({
        rowNo: i + 1,
        productInfo,
        matched: false,
        codes: [],
        duplicated: false,
        reason: '未命中任何编码规则',
        fieldValues
      })
    } else if (hitCodes.length === 1) {
      results.push({
        rowNo: i + 1,
        productInfo,
        matched: true,
        codes: [hitCodes[0]],
        duplicated: false,
        reason: '',
        fieldValues
      })
    } else {
      results.push({
        rowNo: i + 1,
        productInfo,
        matched: true,
        codes: hitCodes,
        duplicated: true,
        reason: `重复命中 ${hitCodes.length} 个编码`,
        fieldValues
      })
    }
  }

  matchResults.value = results

  const total = results.length
  const matched = results.filter(r => r.matched && !r.duplicated).length
  const unmatched = results.filter(r => !r.matched).length
  const duplicated = results.filter(r => r.duplicated).length

  matchSummary.value = {
    total,
    matched,
    unmatched,
    duplicated,
    hasError: unmatched > 0 || duplicated > 0
  }

  resultFilter.value = 'all'

  if (duplicated > 0) {
    ElMessage.warning(`匹配完成：${matched} 条成功，${unmatched} 条未命中，${duplicated} 条重复命中`)
  } else if (unmatched > 0) {
    ElMessage.warning(`匹配完成：${matched} 条成功，${unmatched} 条未命中`)
  } else {
    ElMessage.success(`全部 ${total} 条商品信息匹配成功！`)
  }
}

const exportResults = () => {
  if (!matchResults.value.length) {
    ElMessage.warning('暂无结果可导出')
    return
  }

  try {
    const headers = [
      '序号',
      ...selectedFields.value,
      '商品信息',
      '编码状态',
      '商品编码',
      '异常信息'
    ]

    const rows = matchResults.value.map(r => [
      r.rowNo,
      ...selectedFields.value.map(f => r.fieldValues[f] ?? ''),
      r.productInfo,
      r.matched ? '已匹配' : '未匹配',
      r.codes.join(', ') || '未命中',
      r.duplicated ? `重复命中：${r.codes.join('、')}` : (r.reason || '正常')
    ])

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '编码结果')

    XLSX.writeFile(wb, `商品编码结果_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.xlsx`)
    ElMessage.success('导出成功')
  } catch {
    ElMessage.error('导出失败')
  }
}
</script>

<style scoped>
.product-code-page {
  padding: 10px;
}

.upload-card {
  border-radius: 8px;
  background-color: #fff;
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.uploaded-file-area {
  margin-top: 16px;
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-radius: 6px;
  border: 1px solid #ebeef5;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #303133;
}

.file-icon {
  color: #909399;
  font-size: 16px;
}

.file-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.file-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.delete-btn {
  color: #909399;
  cursor: pointer;
  font-size: 14px;
  transition: color 0.3s;
}

.delete-btn:hover {
  color: #f56c6c;
}

.file-uploader {
  width: 100%;
}

.file-uploader :deep(.el-upload-dragger) {
  padding: 30px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  transition: border-color 0.3s;
}

.file-uploader :deep(.el-upload-dragger:hover) {
  border-color: #409EFF;
}

.upload-file-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-top: 8px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.selected-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px;
  min-height: 40px;
  border: 1px dashed #dcdfe6;
  border-radius: 6px;
  background-color: #fafafa;
}

.field-tag {
  margin: 2px 4px;
}

:global(.sortable-ghost) {
  opacity: 0.4;
  background: #e8f4fd;
}

:global(.sortable-chosen) {
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:global(.sortable-drag) {
  opacity: 0.8;
}

/* ===== 商品编码表区域 ===== */
.condition-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
  gap: 8px;
}

/* ✅ 大框边框改成绿色 */
.condition-group-box {
  display: inline-block;
  padding: 10px 14px;
  border: 1px solid #67c23a;  /* ✅ 绿色边框 */
  border-radius: 8px;
  background-color: #fafafa;
  position: relative;
  min-width: 180px;
}
</style>