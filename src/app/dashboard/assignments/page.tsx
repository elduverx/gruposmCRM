import { getAssignments } from '../properties/actions';
import AssignmentsClient from './AssignmentsClient';

export default async function AssignmentsPage() {
  const assignments = await getAssignments();

  return (
    <AssignmentsClient initialAssignments={assignments} />
  );
} 