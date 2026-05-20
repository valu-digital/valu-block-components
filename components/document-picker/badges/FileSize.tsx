import { FileMeta } from '../styles';
import { formatFileSize } from '../utils';

export interface FileSizeProps {
	bytes: number | undefined;
}

export const FileSize = ({ bytes }: FileSizeProps) => {
	const formatted = formatFileSize(bytes);
	if (!formatted) return null;
	return <FileMeta>{formatted}</FileMeta>;
};
