import { Config } from "@aiostreams/types";
import path from "path";

const PRIVATE_CIDR = /^(10\.|127\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/;

export function createProxiedMediaFlowUrl(url: string, mediaFlowConfig: Config["mediaFlowConfig"], headers?: 
    { request?: Record<string, string>, response?: Record<string, string> }) {
    const streamUrl = url;
    const mediaFlowUrl = mediaFlowConfig?.proxyUrl?.replace(/\/$/, '');
    const mediaFlowApiPassword = mediaFlowConfig?.apiPassword;
    if (!streamUrl) {
      console.error('|ERR| mediaflow > createProxiedMediaFlowUrl > streamUrl is missing, could not create proxied URL');
      throw new Error('Stream URL is missing');
    }
    if (!mediaFlowConfig) {
      console.error('|ERR| mediaflow > createProxiedMediaFlowUrl > mediaFlowConfig is missing');
      throw new Error('MediaFlow configuration is missing');
    }
    if (!mediaFlowUrl || !mediaFlowApiPassword) {
      console.error('|ERR| mediaflow > createProxiedMediaFlowUrl > mediaFlowUrl or API password is missing');
      throw new Error('MediaFlow URL or API password is missing');
    }

    const queryParams: Record<string, string> = {
      api_password: mediaFlowApiPassword,
    }
    queryParams.d = streamUrl;

    const responseHeaders = headers?.response || {
      "Content-Disposition": `attachment; filename=${path.basename(streamUrl)}`
    };
    const requestHeaders = headers?.request || {};

    if (requestHeaders) {
      Object.entries(requestHeaders).forEach(([key, value]) => {
        queryParams[`h_${key}`] = value;
      });
    }

    if (responseHeaders) {
      Object.entries(responseHeaders).forEach(([key, value]) => {
        queryParams[`r_${key}`] = value;
      });
    }
    
    const encodedParams = new URLSearchParams(queryParams).toString();
    const baseUrl = new URL('/proxy/stream', mediaFlowUrl).toString();
    const proxiedUrl = `${baseUrl}?${encodedParams}`;
    //console.debug(`|DBG| mediaflow > createProxiedMediaFlowUrl > Proxied URL: ${proxiedUrl.replace(mediaFlowApiPassword, '***').replace(streamUrl, '***')}`);
    return proxiedUrl;
}


export async function getMediaFlowPublicIp(mediaFlowConfig: Config["mediaFlowConfig"]) {
  if (!mediaFlowConfig) {
    console.error('|ERR| mediaflow > getMediaFlowPublicIp > mediaFlowConfig is missing');
    throw new Error('MediaFlow configuration is missing');
  }
  const mediaFlowUrl = mediaFlowConfig?.proxyUrl?.replace(/\/$/, '');
  if (!mediaFlowUrl) {
    console.error('|ERR| mediaflow > getMediaFlowPublicIp > mediaFlowUrl is missing');
    throw new Error('MediaFlow URL is missing');
  }
  if (mediaFlowConfig.publicIp) {
    return mediaFlowConfig.publicIp;
  }

  const parsedUrl = new URL(mediaFlowUrl);
  if (PRIVATE_CIDR.test(parsedUrl.hostname)) {
    // MediaFlow proxy URL is a private IP address
    console.debug('|DBG| mediaflow > getMediaFlowPublicIp > MediaFlow proxy URL is a private IP address so returning null');
    return null;
  }

  try {
    console.debug('|DBG| mediaflow > getMediaFlowPublicIp > GET /proxy/ip?api_password=***');
    const response = await fetch(new URL(`/proxy/ip?api_password=${encodeURIComponent(mediaFlowConfig.apiPassword)}`, mediaFlowUrl).toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },

    });

    if (!response.ok) {
      throw new Error(`${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const publicIp = data.ip;
    return publicIp;

  } catch (error: any) {
    console.error(`|ERR| mediaflow > getMediaFlowPublicIp > Failed to get public IP from MediaFlow - ${error.message}`);
    return null;
  }

    


    
}