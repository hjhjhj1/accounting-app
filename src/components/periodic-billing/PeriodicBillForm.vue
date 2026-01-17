<template>
  <div class="bill-form">
    <h3 class="bill-form__title">账单设置</h3>

    <div class="bill-form__group">
      <label class="bill-form__label">开始日期</label>
      <input
        v-model="formattedStartDate"
        type="date"
        class="bill-form__input"
        @change="handleDateChange"
      />
    </div>

    <div class="bill-form__group">
      <label class="bill-form__label">总期数</label>
      <input
        v-model.number="totalPeriods"
        type="number"
        min="1"
        max="100"
        class="bill-form__input"
        @change="handlePeriodsChange"
      />
      <div class="bill-form__hint">建议设置36期以获得最佳预览体验</div>
    </div>

    <div class="bill-form__group">
      <label class="bill-form__label">每期金额</label>
      <input
        v-model.number="amount"
        type="number"
        min="0"
        step="0.01"
        class="bill-form__input"
        placeholder="0.00"
        @change="handleAmountChange"
      />
    </div>

    <div class="bill-form__group">
      <label class="bill-form__label">账单描述</label>
      <textarea
        v-model="description"
        class="bill-form__textarea"
        rows="3"
        placeholder="例如：房租、物业费、会员费等"
        @change="handleDescriptionChange"
      ></textarea>
    </div>

    <button
      class="bill-form__generate-btn"
      @click="handleGenerate"
    >
      生成账单计划
    </button>
  </div>
</template>

<script>
import { ref, watch } from 'vue'

export default {
  name: 'PeriodicBillForm',
  props: {
    modelValue: {
      type: Object,
      required: true
    }
  },
  emits: ['update:modelValue', 'generate'],
  setup(props, { emit }) {
    const formattedStartDate = ref('')
    const totalPeriods = ref(36)
    const amount = ref(0)
    const description = ref('')

    const formatDateForInput = (date) => {
      const d = new Date(date)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    watch(() => props.modelValue, (settings) => {
      if (settings) {
        formattedStartDate.value = formatDateForInput(settings.startDate)
        totalPeriods.value = settings.totalPeriods
        amount.value = settings.amount
        description.value = settings.description || ''
      }
    }, { immediate: true })

    const handleDateChange = () => {
      if (formattedStartDate.value) {
        const date = new Date(formattedStartDate.value)
        emit('update:modelValue', {
          ...props.modelValue,
          startDate: date
        })
      }
    }

    const handlePeriodsChange = () => {
      emit('update:modelValue', {
        ...props.modelValue,
        totalPeriods: totalPeriods.value
      })
    }

    const handleAmountChange = () => {
      emit('update:modelValue', {
        ...props.modelValue,
        amount: amount.value
      })
    }

    const handleDescriptionChange = () => {
      emit('update:modelValue', {
        ...props.modelValue,
        description: description.value
      })
    }

    const handleGenerate = () => {
      emit('generate')
    }

    return {
      formattedStartDate,
      totalPeriods,
      amount,
      description,
      handleDateChange,
      handlePeriodsChange,
      handleAmountChange,
      handleDescriptionChange,
      handleGenerate
    }
  }
}
</script>

<style scoped>
.bill-form {
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.bill-form__title {
  margin: 0 0 24px 0;
  font-size: 18px;
  color: #1f2937;
  font-weight: 600;
}

.bill-form__group {
  margin-bottom: 20px;
}

.bill-form__label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.bill-form__input {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.bill-form__input:focus {
  outline: none;
  border-color: #3b82f6;
}

.bill-form__textarea {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.bill-form__textarea:focus {
  outline: none;
  border-color: #3b82f6;
}

.bill-form__hint {
  margin-top: 6px;
  font-size: 12px;
  color: #6b7280;
}

.bill-form__generate-btn {
  width: 100%;
  padding: 14px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.bill-form__generate-btn:hover {
  background: #2563eb;
}

.bill-form__generate-btn:active {
  background: #1d4ed8;
}
</style>
