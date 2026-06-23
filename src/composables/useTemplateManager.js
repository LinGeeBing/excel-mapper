import { ref } from 'vue'

const STORAGE_KEY = 'consistency_templates'

/* 读取模板 */
const loadTemplates = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch {
    return []
  }
}

/* 保存模板 */
const saveTemplates = (list) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

/* 响应式数据 */
const templates = ref(loadTemplates())
const selectedTemplateId = ref(null)

/* 选择模板 */
const selectTemplate = (id) => {
  selectedTemplateId.value = id
}

/* 新增模板 */
const addTemplate = (template) => {
  const newTemplate = {
    ...template,
    id: Date.now().toString(),
    createdAt: new Date().toLocaleString(),
    updatedAt: new Date().toLocaleString()
  }
  templates.value.push(newTemplate)
  saveTemplates(templates.value)
}

/* 删除模板 */
const deleteTemplate = (id) => {
  templates.value = templates.value.filter(t => t.id !== id)
  saveTemplates(templates.value)
}

/* 更新模板 */
const updateTemplate = (id, newData) => {
  const index = templates.value.findIndex(t => t.id === id)
  if (index > -1) {
    templates.value[index] = {
      ...templates.value[index],
      ...newData,
      updatedAt: new Date().toLocaleString()
    }
    saveTemplates(templates.value)
  }
}

export function useTemplateManager() {
  return {
    templates,
    selectedTemplateId,
    selectTemplate,
    addTemplate,
    deleteTemplate,
    updateTemplate
  }
}