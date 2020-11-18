<template>
  <div class="wrapper">
    <DataTable post="users" view="default" showId />
  </div>
</template>

<script lang="ts">
import { onMounted } from 'vue'
import DataTable from './components/Table.vue'

export default {
  components: {
    DataTable,
  },
  data: () => ({
    tableData: {},
  }),
  
  /*
  ** TODO: Learn composition API.... :o
  **
  setup(){
    let tableData = null
    const fetchData = async() => {
      const response = await fetch('/_api_/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          post: 'users',
          view: 'default'
        })
      })
      tableData = await response.json();
      console.log(tableData)
    }

    onMounted(() => {
      fetchData()
    })
    return {
      fetchData,
      tableData
    }
  }
  */
}
</script>

<style>
.wrapper {
  margin: 15px 15px 0;
}
</style>
