declare module "i18next-resources-to-backend" {
	import type {
		BackendModule,
		ReadCallback,
		Resource,
		ResourceKey,
	} from "i18next"

	type ImportFn = ((
		language: string,
		namespace: string,
		callback: ReadCallback,
	) => void) | ((
		language: string,
		namespace: string,
	) => Promise<ResourceKey | boolean | null | undefined>)

	function resourcesToBackend(res: ImportFn | Resource): BackendModule

	export default resourcesToBackend
}
