/**
 * 待办事项组件
 * 支持添加、完成、删除任务
 */
import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import './TodoList.css';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

interface TodoListProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY = 'jun-panel-todos';

export function TodoList({ isOpen, onClose }: TodoListProps) {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  // 加载
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setTodos(JSON.parse(saved));
      } catch {
        setTodos([]);
      }
    }
  }, []);

  // 保存
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    if (!newTodo.trim()) return;
    
    const item: TodoItem = {
      id: Date.now().toString(),
      text: newTodo.trim(),
      completed: false,
      createdAt: Date.now(),
    };
    setTodos([item, ...todos]);
    setNewTodo('');
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    ));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  const clearCompleted = () => {
    setTodos(todos.filter(t => !t.completed));
  };

  const filteredTodos = todos.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const activeCount = todos.filter(t => !t.completed).length;
  const completedCount = todos.filter(t => t.completed).length;

  if (!isOpen) return null;

  return (
    <div className="todo-overlay" onClick={onClose}>
      <div className="todo-container glass-card" onClick={(e) => e.stopPropagation()}>
        <div className="todo-header">
          <h3>
            <Icon icon="mdi:checkbox-marked-circle-outline" />
            待办事项
          </h3>
          <button className="btn-icon" onClick={onClose}>
            <Icon icon="mdi:close" />
          </button>
        </div>

        <div className="todo-input-row">
          <input
            type="text"
            className="todo-input"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTodo()}
            placeholder="添加新任务..."
          />
          <button className="btn-primary todo-add-btn" onClick={addTodo}>
            <Icon icon="mdi:plus" />
          </button>
        </div>

        <div className="todo-filters">
          <button 
            className={`todo-filter ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            全部 ({todos.length})
          </button>
          <button 
            className={`todo-filter ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            待完成 ({activeCount})
          </button>
          <button 
            className={`todo-filter ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            已完成 ({completedCount})
          </button>
        </div>

        <ul className="todo-list">
          {filteredTodos.length === 0 ? (
            <li className="todo-empty">
              <Icon icon="mdi:clipboard-check-outline" />
              <span>暂无任务</span>
            </li>
          ) : (
            filteredTodos.map(todo => (
              <li key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
                <button 
                  className="todo-check"
                  onClick={() => toggleTodo(todo.id)}
                >
                  <Icon icon={todo.completed ? 'mdi:checkbox-marked-circle' : 'mdi:checkbox-blank-circle-outline'} />
                </button>
                <span className="todo-text">{todo.text}</span>
                <button 
                  className="todo-delete"
                  onClick={() => deleteTodo(todo.id)}
                  title="删除"
                >
                  <Icon icon="mdi:delete-outline" />
                </button>
              </li>
            ))
          )}
        </ul>

        {completedCount > 0 && (
          <div className="todo-footer">
            <button className="todo-clear" onClick={clearCompleted}>
              <Icon icon="mdi:broom" />
              清除已完成 ({completedCount})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TodoList;
