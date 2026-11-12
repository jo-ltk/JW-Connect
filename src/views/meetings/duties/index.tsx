import { Text, View } from '@react-pdf/renderer';
import { Document, Page, PageContent, PageHeader } from '@views/components';
import { TemplateMeetingDutiesProps } from './index.types';

// MEPTOR teal (see design system): ink, strong teal, soft tints
const COLORS = {
  ink: '#0D191C',
  ink2: '#4A5B60',
  teal: '#2B636B',
  tint: '#F1F8F9',
  line: '#C3E3E8',
};

const TemplateMeetingDuties = ({
  title,
  congregation,
  lang,
  weekLabel,
  draftLabel,
  meetings,
}: TemplateMeetingDutiesProps) => {
  return (
    <Document title={title} lang={lang}>
      <Page>
        <PageContent gap={16}>
          <PageHeader
            variant="main"
            title={title}
            congregationName={congregation}
            backgroundColor={COLORS.teal}
          />

          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: 500, color: COLORS.ink }}>
              {weekLabel}
            </Text>
            {draftLabel && (
              <Text
                style={{
                  fontSize: 9,
                  color: COLORS.ink2,
                  textTransform: 'uppercase',
                }}
              >
                {draftLabel}
              </Text>
            )}
          </View>

          {meetings.map((meeting) => (
            <View
              key={meeting.title}
              wrap={false}
              style={{
                border: `1px solid ${COLORS.line}`,
                borderRadius: 8,
              }}
            >
              <View
                style={{
                  backgroundColor: COLORS.tint,
                  padding: '8px 12px',
                  borderTopLeftRadius: 8,
                  borderTopRightRadius: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 8,
                    color: COLORS.ink2,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  {meeting.title}
                </Text>
                <Text
                  style={{ fontSize: 12, fontWeight: 500, color: COLORS.ink }}
                >
                  {meeting.date}
                </Text>
              </View>

              {meeting.note && (
                <Text style={{ fontSize: 10, color: COLORS.ink2, padding: 12 }}>
                  {meeting.note}
                </Text>
              )}

              {meeting.rows.map((row, index) => (
                <View
                  key={`${row.position}-${index}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    padding: '7px 12px',
                    borderTop: `1px solid ${COLORS.line}`,
                  }}
                >
                  <Text
                    style={{ width: '45%', fontSize: 10, color: COLORS.ink2 }}
                  >
                    {row.position}
                  </Text>
                  <Text
                    style={{
                      width: '55%',
                      fontSize: 10,
                      fontWeight: 500,
                      color: row.person ? COLORS.ink : COLORS.ink2,
                    }}
                  >
                    {row.person || '—'}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </PageContent>
      </Page>
    </Document>
  );
};

export default TemplateMeetingDuties;
