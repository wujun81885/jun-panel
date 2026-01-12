/**
 * 便签组件 - 类似 Windows 便签
 * 支持多个便签，可添加、编辑、删除
 */
import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import './Notepad.css';

interface Note {
  id: string;
  content: string;
  color: string;
  createdAt: number;
}

interface NotepadProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY = 'jun-panel-notes';

// 便签颜色
const NOTE_COLORS = [
  { name: '黄色', value: '#fef3c7' },
  { name: '粉色', value: '#fce7f3' },
  { name: '蓝色', value: '#dbeafe' },
  { name: '绿色', value: '#d1fae5' },
  { name: '紫色', value: '#ede9fe' },
];

export function Notepad({ isOpen, onClose }: NotepadProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<string | null>(null);

  // 从本地存储加载
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setNotes(JSON.parse(saved));
      } catch {
        setNotes([]);
      }
    }
  }, []);

  // 保存到本地存储
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  // 添加新便签
  const addNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      content: '',
      color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)].value,
      createdAt: Date.now(),
    };
    setNotes([newNote, ...notes]);
    setActiveNote(newNote.id);
  };

  // 更新便签内容
  const updateNote = (id: string, content: string) => {
    setNotes(notes.map(note => 
      note.id === id ? { ...note, content } : note
    ));
  };

  // 更新便签颜色
  const updateNoteColor = (id: string, color: string) => {
    setNotes(notes.map(note => 
      note.id === id ? { ...note, color } : note
    ));
  };

  // 删除便签
  const deleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id));
    if (activeNote === id) {
      setActiveNote(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="notepad-overlay" onClick={onClose}>
      <div className="notepad-container" onClick={(e) => e.stopPropagation()}>
        <div className="notepad-header">
          <h3>
            <Icon icon="mdi:note-multiple" />
            便签
          </h3>
          <div className="notepad-actions">
            <button className="btn-icon notepad-add" onClick={addNote} title="新建便签">
              <Icon icon="mdi:plus" />
            </button>
            <button className="btn-icon" onClick={onClose}>
              <Icon icon="mdi:close" />
            </button>
          </div>
        </div>

        <div className="notepad-grid">
          {notes.length === 0 ? (
            <div className="notepad-empty">
              <Icon icon="mdi:note-plus" />
              <p>还没有便签</p>
              <button className="btn-primary" onClick={addNote}>
                <Icon icon="mdi:plus" />
                新建便签
              </button>
            </div>
          ) : (
            notes.map(note => (
              <div
                key={note.id}
                className={`sticky-note ${activeNote === note.id ? 'active' : ''}`}
                style={{ backgroundColor: note.color }}
                onClick={() => setActiveNote(note.id)}
              >
                <div className="sticky-note-header">
                  <div className="sticky-note-colors">
                    {NOTE_COLORS.map(c => (
                      <button
                        key={c.value}
                        className={`color-dot ${note.color === c.value ? 'active' : ''}`}
                        style={{ backgroundColor: c.value }}
                        onClick={(e) => { e.stopPropagation(); updateNoteColor(note.id, c.value); }}
                        title={c.name}
                      />
                    ))}
                  </div>
                  <button
                    className="sticky-note-delete"
                    onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                    title="删除"
                  >
                    <Icon icon="mdi:close" />
                  </button>
                </div>
                <textarea
                  className="sticky-note-content"
                  value={note.content}
                  onChange={(e) => updateNote(note.id, e.target.value)}
                  placeholder="写点什么..."
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="sticky-note-footer">
                  {new Date(note.createdAt).toLocaleDateString('zh-CN')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Notepad;
