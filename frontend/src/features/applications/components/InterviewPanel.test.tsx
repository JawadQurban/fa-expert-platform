import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, renderWithProviders, screen } from '@/test/test-utils';
import { getApplicationDetailContent } from '../applicationDetail.content';
import type { ApplicantInterviewDto } from '../applicationDetail.types';
import { InterviewPanel } from './InterviewPanel';

const content = getApplicationDetailContent('ar');
const copy = content.interview;
const MEETING = 'https://teams.microsoft.com/l/meetup-join/interview';

const CONFIRMED: ApplicantInterviewDto = {
  phase: 'scheduled',
  proposedSlots: [{ id: 'slot-1', startsAt: '2030-08-05T06:00:00Z' }],
  selectedSlotId: 'slot-1',
  selectionSla: null,
  canRequestReschedule: true,
  pendingReschedule: null,
  ticketNumber: 'INT-2030-0001',
  meetingUrl: MEETING,
};

function renderPanel(interview: ApplicantInterviewDto) {
  return renderWithProviders(
    <InterviewPanel
      interview={interview}
      content={content}
      busy={false}
      formatSlot={content.formatSlot}
      onSelectSlot={vi.fn()}
      onRequestReschedule={vi.fn()}
    />
  );
}

describe('InterviewPanel — the applicant’s interview (J-06)', () => {
  it('a confirmed interview still ahead offers the meeting', () => {
    renderPanel(CONFIRMED);
    expect(screen.getByRole('link', { name: copy.joinMeeting })).toHaveAttribute('href', MEETING);
    expect(screen.queryByText(copy.ended.title)).not.toBeInTheDocument();
  });

  it('BUG-052/053: a confirmed interview that is over says it ended — no link, no reschedule', async () => {
    const { container } = renderPanel({
      ...CONFIRMED,
      phase: 'ended',
      canRequestReschedule: false,
    });
    expect(screen.getByText(copy.ended.title)).toBeInTheDocument();
    expect(screen.getByText(copy.ended.afterConfirmed)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: copy.joinMeeting })).not.toBeInTheDocument();
    expect(screen.queryByText(copy.meetingPending)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: copy.reschedule.action })).not.toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('BUG-052: proposals that lapsed unpicked never ask for a confirmation', () => {
    renderPanel({
      ...CONFIRMED,
      phase: 'ended',
      // The server serves no past proposal for choosing.
      proposedSlots: [],
      selectedSlotId: null,
      meetingUrl: null,
    });
    expect(screen.getByText(copy.ended.lapsed)).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: copy.selectSlot })).not.toBeInTheDocument();
    // Nothing was ever held, so another time can still be asked for.
    expect(screen.getByRole('button', { name: copy.reschedule.action })).toBeInTheDocument();
  });

  it('an interview under way says so and keeps the link', () => {
    renderPanel({ ...CONFIRMED, phase: 'in-progress', canRequestReschedule: false });
    expect(screen.getByText(copy.inProgress)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: copy.joinMeeting })).toBeInTheDocument();
  });
});
