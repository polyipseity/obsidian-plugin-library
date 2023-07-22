declare module "i18next" {
	interface CustomTypeOptions {
		readonly defaultNS: typeof LibraryLocales.DEFAULT_NAMESPACE
		readonly resources: LibraryLocales.Resources
		readonly returnNull: typeof LibraryLocales.RETURN_NULL
	}
}
import type { } from "i18next"
import type { LibraryLocales } from "../../../assets/locales.js"
