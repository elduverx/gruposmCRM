interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'white';
}

export function Spinner({ size = 'md', color = 'primary' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const colorClasses = {
    primary: 'border-primary-600 border-r-transparent',
    secondary: 'border-blue-600 border-r-transparent',
    white: 'border-white border-r-transparent'
  };

  return (
    <div
      className={`inline-block animate-spin rounded-full border-4 border-solid ${sizeClasses[size]} ${colorClasses[color]} align-[-0.125em]`}
      role="status"
    >
      <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
        Cargando...
      </span>
    </div>
  );
} 