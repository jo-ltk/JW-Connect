import Typography from '@components/typography';

const DemoBanner = ({
  environment = 'TEST',
}: {
  environment?: 'TEST' | 'STAGING';
}) => {
  return (
    <Typography
      className="label-small-medium"
      align="center"
      sx={{
        color: 'var(--always-white)',

        backgroundColor:
          environment === 'TEST' ? 'var(--accent-main)' : 'var(--green-main)',

        borderRadius: 'var(--radius-max)',
        padding: '2px 8px',
        lineHeight: 1.2,
        width: 'fit-content',
        flexShrink: 0,
      }}
    >
      {environment}
    </Typography>
  );
};

export default DemoBanner;
