import Label from "./Label";

export default function StatItem({ stat, value, color, labelStyling }) {
  return (
    <div className="flex w-full items-center justify-between">
      <p className="font-medium">{stat}</p>
      <Label color={color} customStyling={labelStyling}>{value}</Label>
    </div>
  );
}
