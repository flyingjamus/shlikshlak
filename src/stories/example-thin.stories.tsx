export const D = ({ value }: { value: string }) => {
  return <div>HEllo {value}</div>
}

export const StoryRoot = () => (
  <div>
    <D key={"1233232312312"} value={":-)"} />
  </div>
)
