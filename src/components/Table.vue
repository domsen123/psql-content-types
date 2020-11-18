<template>
<div class="datatable">
  <div class="toolbar">
    <div class="toolbar-btn" @click="showForm('new')">New Item</div>
    <div class="toolbar-btn" :class="{disabled: !hasSelectedItem}" @click="showForm('update')">Update Item</div>
    <div class="toolbar-btn" :class="{disabled: !hasMultipleSelectedItems}" @click="deleteItem()">Delete Item</div>
    <div class="toolbar-btn" @click="fetchData()">Refresh List</div>
    <div class="toolbar-btn" @click="showForm('createField')">Create Field</div>
    <div class="toolbar-btn" @click="debug = !debug">Debug</div>
    <input class="searchbar" placeholder="Search... [enter]" v-model="query" @keyup.enter="fetchData()" />
  </div>
  <template  v-if="hasData">
    <table class="table">
      <thead>
        <tr>
          <th v-if="selectable" />
          <th v-if="showId" v-text="`ID`" />
          <th v-for="header in tableData.viewFields" :key="header.id" v-text="header.title" />
          <template v-if="showTimestamps">
            <th v-text="`Updated At`" width="160" />
            <th v-text="`Created At`" width="160" />
          </template>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.id">
          <td v-if="selectable" class="checkbox" v-text="item.selected ? 'x' : 'o'" @click="selectItem(item)" />
          <td v-if="showId" v-text="item.id" />
          <td v-for="header in tableData.viewFields" :key="header.id" v-text="item[header.slug]" />
          <template v-if="showTimestamps">
            <td v-text="moment(item['updated_at']).format('L LT')" />
            <td v-text="moment(item['created_at']).format('L LT')" />
          </template>
        </tr>
      </tbody>
    </table>

    <div class="form" v-if="formType === 1">
      <h2>{{ form && form.id ? 'Update' : 'Create' }} Item</h2>
      <div class="form-wrapper" v-for="field in tableData.postFields" :key="field.id">
        <label v-text="field.title" />
        <input :type="field.type" v-model="form[field.slug]" />
      </div>
      <div class="btn btn-submit" @click="updateItem">Send</div>
      <pre v-text="form" />
    </div>

    <div class="form" v-if="formType === 2">
      <h2>Create Field</h2>
      <div class="form-wrapper">
        <label>Title</label>
        <input type="text" v-model="form.title" />
        <div class="hint">slug: {{camelize(form.title || '')}}</div>
      </div>
      <div class="form-wrapper">
        <label>Type</label>
        <select v-model="form.type">
          <option>text</option>
          <option>password</option>
        </select>
      </div>
      <div class="form-wrapper">
        <label>Add to default view?</label>
        <input type="checkbox" v-model="form.defaultView" />
      </div>
      <div class="btn btn-submit" @click="createField">Send</div>
      <pre v-text="form" />
    </div>
  </template>
  <pre v-if="debug" v-text="tableData" />
</div>
</template>

<script lang="ts">
import moment from 'moment'
import { FetchPostProps } from '../api'
type formType = 'new' | 'update' | 'createField'
export default {
  name: 'DataTable',
  props: {
    post: {
      type: String,
      required: true
    },
    view: {
      type: String,
      default: 'default'
    },
    showId: {
      type: Boolean,
      default: false
    },
    showTimestamps: {
      type: Boolean,
      default: true
    },
    selectable: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    hasData(): boolean{
      return Object.keys(this.tableData).length > 0
    },
    hasSelectedItem(): boolean{
      return this.selected.length === 1
    },
    hasMultipleSelectedItems(): boolean{
      return this.selected.length >= 1
    },
    items(): any {
      if (!this.hasData) return []
      return (this.tableData as any).viewData.map((item: any) => ({
        ...item,
        selected: this.selected.includes((item.item_id) as never)
      }))
    }
  },
  data: () => ({
    debug: false,
    tableData: {},
    selected: [],
    formType: 0,
    form: {},
    query: ''
  }),
  methods: {
    moment,
    camelize (str: string): string  {
      // TODO: BETTER SLUGIFY!!!
      return str
        .replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
          return index === 0 ? word.toLowerCase() : word.toUpperCase();
        })
        .replace(/\s+/g, '');
    },
    resetForms(){
      this.formType = 0
      this.form = {}
    },
    showForm (formType: formType) {
      this.resetForms()
      switch(formType){
        case 'new': {
          this.selected = []
          this.formType = 1
          break
        }
        case 'update': {
          if (this.selected.length === 1) {
            const selected = this.selected[0]
            this.form = {
              id: selected,
              ...Object.assign(
                {},
                ...Object.keys((this.tableData as any).postData.find(item => item.id === selected))
                  .filter(key => (this.tableData as any).postFields
                    .map((f: any) => f.slug).includes(key)
                  )
                  .map(key => ({[key]: (this.tableData as any).postData.find(item => item.id === selected)[key]}))
              )
            }
            this.formType = 1
          }
          break
        }
        case 'createField': {
          this.formType = 2
          break
        }
      }
    },
    selectItem(item: any){
      if (this.selected.includes(item.item_id)) {
        this.selected.splice(this.selected.indexOf(item.item_id), 1)
      }
      else {
        this.selected.push(item.item_id)
      }
      this.resetForms()
    },
    async fetchData() {
      const body: FetchPostProps = {
        post: this.post,
        view: this.view,
        action: 'get',
        query: this.query
      }
      const response = await fetch('/_api_/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })
      this.tableData = await response.json();
    },
    async updateItem(){
      const body: FetchPostProps = {
        post: this.post,
        view: this.view,
        action: 'update',
        form: this.form
      }
      const response = await fetch('/_api_/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body) 
      })
      this.tableData = await response.json();
      this.selected = []
      this.resetForms()
    },
    async deleteItem() {
      if (this.selected.length === 0) return 

      const body: FetchPostProps = {
        post: this.post,
        view: this.view,
        action: 'delete',
        form: this.selected
      }
      const response = await fetch('/_api_/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })
      this.tableData = await response.json();
      this.resetForms()
    },
    async createField(){
      const form = this.form as any
      if (form){
        if (form.title && form.type) {
          const body: FetchPostProps = {
            post: this.post,
            view: this.view,
            action: 'createField',
            form: {
              ...form,
              slug: this.camelize(form.title),
              defaultView: !!form.defaultView
            }
          }
          const response = await fetch('/_api_/post', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(body) 
          })
          this.tableData = await response.json();
          this.selected = []
          this.resetForms()
        }
        else {
          alert('fields are required!')
        }
      }
    }
  },
  mounted () {
    this.fetchData()
  }
}
</script>

<style>
.datatable .toolbar{
  height: 50px;
  background: #f1f1f1;
  margin-bottom: 20px;
  display: flex;
}
.datatable .toolbar .toolbar-btn {
  padding: 0 15px;
  text-align: center;
  font-weight: bold;
  line-height: 50px;
  border-right: 1px solid #ddd;
}
.datatable .toolbar .toolbar-btn:not(.disabled):hover {
  background-color: #ccc;
  cursor: pointer;
}
.datatable .toolbar .toolbar-btn.disabled {
  color: #ccc;
}
.datatable .toolbar .searchbar{
  margin-left: auto;
  border:none;
  background: #ddd;
  border: 1px solid #ccc;
  padding: 0 10px
}
.datatable .table {
  width: 100%;
  border-collapse: collapse;
}
.datatable th, .datatable td {
  border: 1px solid #ccc;
  padding: 3px;
}
.datatable td.checkbox {
  min-width: 10px;
  cursor: pointer;
  text-align: center;
}
.form{
  padding: 20px 0;
}
.form .form-wrapper{
  margin-bottom: 10px;
}
.form .form-wrapper label {
  display: block;
  font-weight: bold;
}
.form .btn.btn-submit{
  color:  #2c3e50;
  padding: 0 25px;
  max-width: 60px;
  line-height: 30px;
  text-transform: uppercase;
  font-weight: bold;
  font-size: 13px;
  text-align: center;
  border: 1px solid #ddd;
  background: #f1f1f1;
  cursor: pointer;
}
.form .btn.btn-submit:hover {
  background: #ddd;
  color: #000;
}
.form .hint{
  font-size: 13px;
}
</style>