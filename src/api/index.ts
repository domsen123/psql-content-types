import axios from 'axios'

export interface FetchPostProps{
  post: string
  view: string | 'default'
  action: 'get' | 'update' | 'delete' | 'createField'
  query?: string
  form?: any | any[]
}

export interface TableHeader {
  title: string;
  slug: string;
}

export interface Table {
  headers: TableHeader[]
}

export default async (props: FetchPostProps) => {
  const { data } = await axios({
    method: 'POST',
    url: '/_api_/post',
    data: props
  })
  return data
}