// Await https://github.com/evanw/esbuild/issues/1420
export {
	type AwaitResources,
	LibraryLocales,
	type MergeNamespaces,
	type MergeResources,
	type NormalizeLocale,
	mergeResources,
	syncLocale,
} from "../assets/locales.js"
// eslint-disable-next-line @typescript-eslint/no-useless-empty-export
export {
} from "./@types/lib.es5.js"
export {
} from "./@types/obsidian.js"
export {
} from "./components/index.js"
export {
	DocumentationMarkdownView,
} from "./documentation.js"
export {
	type Fixed,
	type Fixer,
	fixArray,
	fixInSet,
	fixTyped,
	markFixed,
} from "./fixers.js"
export {
	type I18nFormatters,
	type I18nNamespaces,
	type I18nResources,
	LanguageManager,
	type TranslationKey,
	createI18n,
} from "./i18n.js"
export {
	addIcon,
	registerIcon,
	registerLucideIcon,
} from "./icons.js"
export {
	type Bundle,
	dynamicRequire,
	dynamicRequireLazy,
	dynamicRequireSync,
	importable,
} from "./import.js"
export {
	DOMClasses,
	FileExtensions,
	LibraryUUIDs,
} from "./magic.js"
export {
	DialogModal,
	EditDataModal,
	ListModal,
	makeModalDynamicWidth,
} from "./modals.js"
export {
	LambdaComponent,
	ResourceComponent,
	type StatusUI,
	UnnamespacedID,
	UpdatableUI,
	addCommand,
	addRibbonIcon,
	awaitCSS,
	cleanFrontmatterCache,
	commandNamer,
	newCollabrativeState,
	notice,
	notice2,
	printError,
	printMalformedData,
	readStateCollabratively,
	recordViewStateHistory,
	saveFileAs,
	statusUI,
	updateView,
	useSettings,
	useSubsettings,
	writeStateCollabratively,
} from "./obsidian.js"
export {
	patchWindows,
} from "./patch.js"
export {
	Platform,
} from "./platform.js"
export type {
	PluginContext,
} from "./plugin.js"
export {
	type HasPrivate,
	type Private,
	type PrivateKeys,
	type PrivateKeys$,
	type RevealPrivate,
	revealPrivate,
	revealPrivateAsync,
} from "./private.js"
export {
	type Rule,
	Rules,
	SettingRules,
	rulesList,
} from "./rules.js"
export {
	AdvancedSettingTab,
} from "./settings-tab.js"
export {
	type ComponentAction,
	closeSetting,
	composeSetters,
	dropdownSelect,
	linkSetting,
	resetButton,
	setTextToEnum,
	setTextToNumber,
} from "./settings-widgets.js"
export {
	SettingsManager,
	registerSettingsCommands,
} from "./settings.js"
export {
	attachFunctionSourceMap,
	attachSourceMap,
	generateFunctionSourceMap,
	generateSourceMap,
} from "./source-maps.js"
export {
	StatusBarHider,
	getStatusBar,
} from "./status-bar.js"
export {
	type InverseTypeofMap,
	type InverseTypeofMapE,
	PRIMITIVE_TYPES,
	PRIMITIVE_TYPES_E,
	type PrimitiveOf,
	type PrimitiveOfE,
	type PrimitiveType,
	type PrimitiveTypeE,
	type TypeofMap,
	type TypeofMapE,
	genericTypeofGuard,
	genericTypeofGuardE,
	primitiveOf,
	primitiveOfE,
	typeofE,
} from "./typeof.js"
export {
	type AnyObject,
	type AsyncFunctionConstructor,
	type Base64String,
	type CodePoint,
	type Deopaque,
	type DistributeKeys,
	type DistributeValues,
	type Evaluate,
	type IsExact,
	NULL_SEM_VER_STRING,
	type ReadonlyTuple,
	type SemVerString,
	type Unchecked,
	codePoint,
	contravariant,
	correctType,
	deopaque,
	launderUnchecked,
	opaqueOrDefault,
	semVerString,
	simplifyType,
} from "./types.js"
export {
	EventEmitterLite,
	Functions,
	type KeyModifier,
	type PromisePromise,
	acquireConditionally,
	activeSelf,
	alternativeRegExp,
	anyToError,
	aroundIdentityFactory,
	assignExact,
	asyncDebounce,
	asyncFunction,
	base64ToBytes,
	base64ToString,
	basename,
	bigIntReplacer,
	bracket,
	bytesToBase64,
	capitalize,
	cartesianProduct,
	clear,
	clearProperties,
	cloneAsFrozen,
	cloneAsWritable,
	consumeEvent,
	copyOnWrite,
	copyOnWriteAsync,
	createChildElement,
	createDocumentFragment,
	deepFreeze,
	destroyWithOutro,
	escapeJavaScriptString,
	escapeQuerySelectorAttribute,
	extname,
	getKeyModifiers,
	inSet,
	insertAt,
	instanceOf,
	isHomogenousArray,
	isNonNil,
	lazyInit,
	lazyProxy,
	logFormat,
	mapFirstCodePoint,
	multireplace,
	onResize,
	onVisible,
	openExternal,
	promisePromise,
	randomNotIn,
	rangeCodePoint,
	remove,
	removeAt,
	replaceAllRegex,
	sleep2,
	splitLines,
	startCase,
	stringToBase64,
	swap,
	typedIn,
	typedKeys,
	typedOwnKeys,
	uncapitalize,
	unexpected,
} from "./util.js"
