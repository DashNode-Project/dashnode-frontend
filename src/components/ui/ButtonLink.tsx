import { Link } from 'react-router';
import type { LinkProps } from 'react-router';
import { buttonClasses } from './Button';
import type { ButtonSize, ButtonVariant } from './Button';

interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/** A real link (keyboard and screen reader friendly) that looks like a button. */
export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className = '',
  ...rest
}: ButtonLinkProps) {
  return <Link {...rest} className={buttonClasses(variant, size, className)} />;
}
