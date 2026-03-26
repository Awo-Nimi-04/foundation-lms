import Label from "./Label";

export default function StatItem({ stat, value, color }) {
  return (
    <div className="flex w-full items-center justify-between">
      <p className="font-medium">{stat}</p>
      <Label color={color}>{value}</Label>
    </div>
  );
}
