import type { RequestHandler } from '@sveltejs/kit';
import { performance } from 'perf_hooks';

import { Logger, LoggerUtils } from '$utils/_logger';
import { twitterSpacesAPIService } from '$core/core';

export const get: RequestHandler = async (request) => {
	try {
		const logger: Logger = LoggerUtils.getInstance('SpaceAPIRequestHandler');
		console.log('request', request);
		const start = performance.now();
		const search = request.url.searchParams.get('search');

		const searchQuery = search || 'Web';

		const twitterSpacesApiCacheResponse = await twitterSpacesAPIService.getSpacesFromCache(
			searchQuery,
		);
		logger.debug('Time Elapsed till cache: ', (performance.now() - start) / 1000);

		if (twitterSpacesApiCacheResponse && twitterSpacesApiCacheResponse.length > 0) {
			logger.debug(
				'Cached response - Total elapsed time: ',
				(performance.now() - start) / 1000,
			);
			return {
				status: 200,
				headers: {
					'Cache-Control': 'public, s-maxage=1200, stale-while-revalidate=600',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(twitterSpacesApiCacheResponse),
			};
		}
		const response = await twitterSpacesAPIService.getSpacesFromAPI(searchQuery);
		logger.debug(
			'Uncached response - Total elapsed time: ',
			(performance.now() - start) / 1000,
		);
		await twitterSpacesAPIService.closeConnection();
		return {
			...response,
			headers: {
				'Content-Type': 'application/json',
			},
		};
	} catch (error) {
		return {
			status: 500,
			body: JSON.stringify({
				error: 'Could not fetch spaces. Error 500',
			}),
			headers: {
				'Content-Type': 'application/json',
			},
		};
	}
};
