const Comp = ({ variant }: { variant: 'A' | 'B'; another: 'A' | 'B' }) => {
  return <>{variant}</>
}

export const Wrapper = () => {
  const variant = 'A'
  return <Comp variant={variant} another={'A'} />
}
