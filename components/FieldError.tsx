type FieldError = {
  id: string;
  message?: string;
};

// Shows a field's validation message below its input. Renders nothing when there is no error.
export default function FieldError({ id, message }: FieldError) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} className="mt-1 text-xs text-red-600">
      {message}
    </p>
  );
}
