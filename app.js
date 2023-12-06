const express = require('express')
const app = express()
app.use(express.json())
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const dbPath = (__dirname, 'todoApplication.db')
let db = null

const initiateServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log('Server is running')
    })
  } catch (e) {
    console.log(`ERROR IS OCCURED AT:${e.message}`)
    process.exit(1)
  }
}

initiateServer()

const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

app.get('/todos/', async (request, response) => {
  let data = ''
  const {search_q = '', priority, status} = request.query
  let getAllTodo = ''
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getAllTodo = `
        SELECT * FROM todo
        WHERE todo LIKe %${search_q}%
        AND priority = '${priority}'
        AND status = '${status}';`
      break
    case hasPriorityProperty(request.query):
      getAllTodo = `
        SELECT * FROM todo
        WHERE todo LIKE %${search_q}%
        AND priority = '${priority}';`
      break
    case hasStatusProperty(request.query):
      getAllTodo = `
        SELECT * FROM todo
        WHERE todo LIKE %${search_q}%
        AND status = '${status}';`
      break
    default:
      getAllTodo = `
        SELECT * FROM todo
        WHERE todo LIKE '%${search_q}%';`
      data = await db.all(getAllTodo)
      response.send(data)
  }
})

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getSingleTodoList = `
    SELECT * FROM todo
    WHERE id = '${todoId}';`
  const getSingle = await db.get(getSingleTodoList)
  response.send(getSingle)
})

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body
  const addTodoList = `
    INSERT INTO todo(id, todo, priority, status)
    VALUES (${id}, '${todo}', '${priority}', '${status}');`
  await db.run(addTodoList)
  response.send('Todo Successfully Added')
})

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const requestBody = request.body
  let updateColumn = ''
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = 'Status'
      break
    case requestBody.priority !== undefined:
      updateColumn = 'Priority'
      break
    case requestBody.todo !== undefined:
      updateColumn = 'Todo'
      break
  }

  const pretodoQuery = `
  SELECT * FROM todo 
  WHERE id = '${todoId}';`
  const previousTodo = await db.get(pretodoQuery)

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.query

  const updateQuery = `
  UPDATE todo 
  SET todo = '${todo}',
  priority = '${priority}',
  status = '${status}'
  WHERE id = '${todoId}';`
  await db.run(updateQuery)
  response.send(`${updateColumn} updated`)
})

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteQuery = `
    DELETE FROM todo
    WHERE id = '${todoId}';`
  await db.run(deleteQuery)
  response.send('Todo Deleted')
})

module.exports = app
