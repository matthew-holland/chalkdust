import React from "react";
import { useEffect, useReducer } from "react"; // using hooks
import { listTodos } from "./graphql/queries";
import { onCreateTodo } from "./graphql/subscriptions";
import API, { graphqlOperation } from "@aws-amplify/api";
import PubSub from "@aws-amplify/pubsub";
import { createTodo } from "./graphql/mutations";

import config from "./aws-exports";
API.configure(config); // Configure Amplify
PubSub.configure(config);

const initialState = { todos: [] };
const reducer = (state, action) => {
  switch (action.type) {
    case "QUERY":
      return { ...state, todos: action.todos };
    case "SUBSCRIPTION":
      return { ...state, todos: [...state.todos, action.todo] };
    default:
      return state;
  }
};

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    getData();
    const subscription = API.graphql(graphqlOperation(onCreateTodo)).subscribe({
      next: eventData => {
        const todo = eventData.value.data.onCreateTodo;
        dispatch({ type: "SUBSCRIPTION", todo });
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function getData() {
    const todoData = await API.graphql(graphqlOperation(listTodos));
    dispatch({ type: "QUERY", todos: todoData.data.listTodos.items });
  }

  async function createNewTodo() {
    const todo = { name: "Ay Dog", description: "Realtime and Offline" };
    await API.graphql(graphqlOperation(createTodo, { input: todo }));
  }

  return (
    <div>
      <div className="App">
        <button onClick={createNewTodo}>Add Todo</button>
      </div>
      <div>
        {state.todos.map((todo, i) => (
          <p key={todo.id}>
            {todo.name} : {todo.description}
          </p>
        ))}
      </div>
    </div>
  );
}

export default App;
