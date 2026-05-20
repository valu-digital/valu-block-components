export * from './components/content-picker';
export * from './components/matrix';

// Document picker — re-exported with disambiguated type names to avoid
// colliding with the content-picker's generic types when consumers import
// from the package root. Use `@valu/block-components/components/document-picker`
// for the clean type names.
export { DocumentPicker, MediaLibraryButton, ExtensionBadge, FileSize } from './components/document-picker';
export {
	DEFAULT_DOCUMENT_MIME_TYPES,
	mapMediaToDocumentItem,
	formatFileSize,
	extensionFromUrl,
	basenameFromUrl,
} from './components/document-picker';
export type {
	DocumentItem,
	DocumentPickerLabels,
	DocumentPickerProps,
	DocumentPickerVariant,
	ResolvedDocumentItem,
	FilterContext as DocumentFilterContext,
	RequestContext as DocumentRequestContext,
	MissingReason as DocumentMissingReason,
	SuggestionRenderState as DocumentSuggestionRenderState,
} from './components/document-picker';
