import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { TextField } from './TextField';
import type { TextFieldProps } from './TextField';

/** Password input hidden by default with an accessible show/hide toggle. */
export function PasswordField(props: Omit<TextFieldProps, 'type' | 'trailing'>) {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
          className="flex h-7 w-7 items-center justify-center rounded text-[#9CA3AF] hover:text-[#F9FAFB]"
        >
          {visible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
        </button>
      }
    />
  );
}
