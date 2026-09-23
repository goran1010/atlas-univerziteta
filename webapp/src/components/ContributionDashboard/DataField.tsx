import { Input } from "../sharedComponents/Input";
import { Label } from "../sharedComponents/Label";

interface DataFieldProps {
  label: string;
  id: string;
  type: string;
  min?: number;
  max?: number;
  required?: boolean;
  value: string | number;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
}

function DataField(props: DataFieldProps) {
  const { label, ...inputProps } = props;
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={props.id} required={props.required}>
        {label}
      </Label>
      <Input {...inputProps} />
    </div>
  );
}

export { DataField };
