import knex from 'knex'
import * as dotenv from "dotenv";
import { FetchPostProps } from '../src/api';
dotenv.config();

const db = knex({
  client: 'pg',
  connection: {
    host: process.env.KNEX_HOST || '127.0.0.1',
    user: process.env.KNEX_USER || 'postgres',
    password: process.env.KNEX_PASSWORD ,
    database: process.env.KNEX_DATABASE || undefined,
    charset: 'utf-8'
  }
})

const superSecretHashing = (plain: string, reverse = false) => {
  const alph = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '!']
  if (reverse)
  return plain.split('').map(char => alph[alph.indexOf(char) -1]).join('')
  return plain.split('').map(char => alph[alph.indexOf(char) + 1]).join('')
}

const compareSuperHash = (comp: string, pw: string) => {
  return comp === superSecretHashing(pw, true)
}

const createInitialSchema = async () => {
  await db.schema
    .dropTableIfExists('item_fields')   
    .dropTableIfExists('items')   
    .dropTableIfExists('view_fields')   
    .dropTableIfExists('fields')  
    .dropTableIfExists('views')  
    .dropTableIfExists('posts')

  await db.schema
    .createTable('posts', (table) => {
      table.increments('id').primary().unsigned();
      table.string('slug');
      table.string('title');
      table.integer('next_item_id')

      table.timestamps();
    })
    .createTable('fields', (table) => { 
      table.increments('id').primary().unsigned();
      table.string('slug');
      table.string('title');
      table.enu('type', ['text', 'password'])
      table.integer('sort');
      
      table.integer('post_id').unsigned().index().references('id').inTable('posts').onDelete('CASCADE')
      table.timestamps();
    })
    .createTable('views', (table) => {
      table.increments('id').primary().unsigned();
      table.string('slug');
      table.string('title');
      
      table.integer('post_id').unsigned().index().references('id').inTable('posts').onDelete('CASCADE')
      table.timestamps();
    })
    .createTable('view_fields', (table) => {
      table.increments('id').primary().unsigned();
      
      table.integer('sort');

      table.integer('field_id').unsigned().index().references('id').inTable('fields').onDelete('CASCADE')
      table.integer('view_id').unsigned().index().references('id').inTable('views').onDelete('CASCADE')
    })
    .createTable('items', (table) => {
      table.increments('id').primary().unsigned();
      
      table.integer('item_id').index()

      table.integer('post_id').unsigned().index().references('id').inTable('posts').onDelete('CASCADE')
      table.timestamps();
    })
    .createTable('item_fields', (table) => {
      table.increments('id').primary().unsigned();

      table.string('value')

      table.integer('item_id').unsigned().index().references('id').inTable('items').onDelete('CASCADE').onUpdate('CASCADE')
      table.integer('field_id').unsigned().index().references('id').inTable('fields').onDelete('CASCADE')
      table.timestamps();
    })

  // INSERT POSTTYPE: USERS
  await db
    .insert([
      { id: 1, slug: 'users', title: 'Users', next_item_id: 4, created_at: new Date(), updated_at: new Date() }
    ])
    .into('posts')

  await db.insert([
    {slug: 'firstName', title: 'First Name', type: 'text', sort: 1, post_id: 1, created_at: new Date(), updated_at: new Date() },
    {slug: 'lastName', title: 'Last Name', type: 'text', sort: 2, post_id: 1 , created_at: new Date(), updated_at: new Date()},
    {slug: 'password', title: 'Password', type: 'password', sort: 3, post_id: 1, created_at: new Date(), updated_at: new Date() },
  ]).into('fields')

  await db.insert([
    {id: 1, slug: 'default', title: 'Default', post_id: 1, created_at: new Date(), updated_at: new Date() },
    {id: 2, slug: 'auth', title: 'Authentication', post_id: 1, created_at: new Date(), updated_at: new Date() }, 
  ]).into('views') 

  await db.insert([
    {field_id: 1, view_id: 1, sort: 1},
    {field_id: 2, view_id: 1, sort: 2},
    {field_id: 1, view_id: 2, sort: 1},
    {field_id: 2, view_id: 2, sort: 2},
    {field_id: 3, view_id: 2, sort: 3}, 
  ]).into('view_fields')

  await db.insert([
    { item_id: 1, post_id: 1, created_at: new Date(), updated_at: new Date() },
    { item_id: 2, post_id: 1, created_at: new Date(), updated_at: new Date() },
    { item_id: 3, post_id: 1, created_at: new Date(), updated_at: new Date() },
  ]).into('items')

  await db.insert([
    {item_id: 1, field_id: 1, value: 'Dominic', created_at: new Date(), updated_at: new Date() },
    {item_id: 1, field_id: 2, value: 'Marx', created_at: new Date(), updated_at: new Date() },
    {item_id: 1, field_id: 3, value: superSecretHashing('Passw0rd'), created_at: new Date(), updated_at: new Date() },
    {item_id: 2, field_id: 1, value: 'John', created_at: new Date(), updated_at: new Date() },
    {item_id: 2, field_id: 2, value: 'Doe', created_at: new Date(), updated_at: new Date() },
    {item_id: 2, field_id: 3, value: superSecretHashing('Passw0rd'), created_at: new Date(), updated_at: new Date() },
    {item_id: 3, field_id: 1, value: 'Andrew', created_at: new Date(), updated_at: new Date() },
    {item_id: 3, field_id: 2, value: 'Powers', created_at: new Date(), updated_at: new Date() },
    {item_id: 3, field_id: 3, value: superSecretHashing('Passw0rd'), created_at: new Date(), updated_at: new Date() },
  ]).into('item_fields')

}

createInitialSchema().then(() => console.log('initial db setup completed'))

export const queryPost = async (args: FetchPostProps): Promise<any> => {
  if (args.action === 'get') {
    // todo: make joins -> demo puprose: this is rubbish
    const searchString = args.query

    // GETTING POST GENERAL DATA
    const { id: post_id } = await db('posts').where('slug', args.post).select('id').first()

    let items = await db('items').where('post_id', post_id)
    let postFields = await db('fields').where('post_id', post_id).orderBy('sort')
    let fieldValues = await db('item_fields').where(builder => builder.whereIn('item_id', items.map((i:any) => i.id)))
    
    // HERE WE DO A SEARCH
    if (searchString){
      const relevantItems = await db('item_fields').where(builder => {
        builder.whereIn('item_id', items.map((i:any) => i.id))
        
        searchString.split(' ').map((chunk, i) => i === 0 ? builder.andWhere('value', 'ILIKE', `%${chunk}%`) : builder.orWhere('value', 'ILIKE', `%${chunk}%`))
        return builder
      })
      items = await db('items').where({ post_id }).andWhere(builder => builder.whereIn('id', relevantItems.map(i => i.item_id)))
      fieldValues = await db('item_fields').where(builder => builder.whereIn('item_id', items.map((i:any) => i.id)))
    }
    // GETTING POST VIEW DATA
    const { id: view_id } = await db('views').where({ slug: args.view, post_id }).select('id').first()
    const viewFieldInfo = await db('view_fields').where({ view_id }).orderBy('sort').select('field_id')
    const viewFields = await db('fields').where(builder => builder.whereIn('id', viewFieldInfo.map(field => field.field_id)))
    const viewFieldValues = await db('item_fields').where(builder => builder.whereIn('item_id', items.map(i => i.id))).andWhere(builder => builder.whereIn('field_id', viewFields.map(f => f.id)))

    const viewData = items.map(item => ({
      ...item,
      ...Object.assign(
        {},
        ...viewFieldValues
          .filter(f => f.item_id === item.id)
          .map((f, i) => ({[viewFields.find(field => field.id === f.field_id).slug || `field_${i}`]: f.value}))
      )
    }))

    const postData = items.map(item => ({
      ...item,
      ...Object.assign( 
        {},
        ...fieldValues
          .filter(f => f.item_id === item.id)
          .map((f, i) => ({[postFields.find(field => field.id === f.field_id).slug || `field_${i}`]: f.value}))
      )
    }))

    return { 
      postFields, 
      viewFields, 
      viewData, 
      postData 
    } 
  }
  else if (args.action === 'update') {
    const { id: post_id, next_item_id } = await db('posts').where('slug', args.post).select(['id', 'next_item_id']).first()
    if (args.form){
      const fieldsToUpdate = await db('fields').where(builder => builder.whereIn('slug', Object.keys(args.form)))
      if (!args.form.id){
        // new
        const now = new Date()
        await db.insert([
          {item_id: next_item_id, post_id, created_at: now, updated_at: now}
        ]).into('items') 

        await db.insert(Object.keys(args.form).map(key => ({
          item_id: next_item_id,
          field_id: fieldsToUpdate.find(field => field.slug === key).id,
          value: fieldsToUpdate.find(field => field.slug === key).type === 'password' ? superSecretHashing(args.form[key]) : args.form[key],
          created_at: now,
          updated_at: now
        }))).into('item_fields') 
        await db('posts').where('id', post_id).update({next_item_id: next_item_id + 1 })
      }
      else { 
        // update
        const currentFieldValues = await db('item_fields').where({item_id: args.form.id})
        const currentFieldIds = currentFieldValues.map(f => f.field_id)
        
        // create not existing fields with emtpy value
        const notExistingFieldIds = fieldsToUpdate.map(f => f.id).filter(f => !currentFieldIds.includes(f))
        await Promise.all(notExistingFieldIds.map(field_id => 
          db('item_fields')
            .insert([{ item_id: args.form.id, field_id, value: '', created_at: new Date(), updated_at: new Date() }])
        )) 

        await Promise.all(fieldsToUpdate.map(field => 
          db('item_fields')
            .where({ item_id: args.form.id, field_id: field.id })
            .update({ value: field.type === 'password' ? superSecretHashing(args.form[field.slug]) : args.form[field.slug]})
        ))
      }
    }
    return queryPost({...args, action: 'get'})
  }
  else if (args.action === 'delete') {
    if (args.form){
      await db('items').where(builder => builder.whereIn('item_id', args.form)).delete()
      return queryPost({...args, action: 'get'})
    }
  }
  else if (args.action === 'createField') {
    const { id: post_id } = await db('posts').where('slug', args.post).select('id').first()
    const { title, slug, type } = args.form

    const currentFieldCount = await db('fields').where({ post_id }).count()
    const sort = (currentFieldCount[0].count as number) + 1

    const fieldIds = await db
      .returning('id')
      .insert([
        { slug, title, type , post_id, sort, created_at: new Date(), updated_at: new Date() },
      ])
      .into('fields')

    const field_id = fieldIds[0]
    if (args.form.defaultView) {
      const { id: view_id } = await db('views').where({ slug: 'default', post_id }).select('id').first()

      const currentViewFieldCount = await db('view_fields').where({ view_id }).count()
      const viewSort = (currentViewFieldCount[0].count as number) + 1
      await db.insert([ 
        {field_id, view_id, sort: viewSort }
      ]).into('view_fields')
    }
    return queryPost({...args, action: 'get'})
  }
}