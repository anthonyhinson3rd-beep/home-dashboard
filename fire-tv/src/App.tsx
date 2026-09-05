import {WebView} from '@amazon-devices/webview';
import * as React from 'react';
import {useEffect, useRef} from 'react';
import {AppState, View, StyleSheet} from 'react-native';
import {
  useHideSplashScreenCallback,
  usePreventHideSplashScreen,
} from '@amazon-devices/react-native-kepler';
import {
  SslErrorData,
  WebViewErrorEvent,
  WebViewHttpErrorEvent,
  WebViewNavigationEvent,
} from '@amazon-devices/webview/dist/types/WebViewTypes';

export const App = () => {
  const webRef = useRef(null);
  const appState = useRef(AppState.currentState);
const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

const reloadDashboard = () => {
  if (retryTimer.current) {
    clearTimeout(retryTimer.current);
  }

  retryTimer.current = setTimeout(() => {
    webRef.current?.reload();
  }, 1500);
};

useEffect(() => {
  const subscription = AppState.addEventListener('change', nextState => {
    if (
      appState.current?.match(/inactive|background/) &&
      nextState === 'active'
    ) {
      reloadDashboard();
    }

    appState.current = nextState;
  });

  return () => {
    subscription.remove();

    if (retryTimer.current) {
      clearTimeout(retryTimer.current);
    }
  };
}, []);
  // By default splash screen is shown in app launch, as the splash
  // screen images are bundled in this app (assets/raw/ folder)
  // Declare that application wants to extend splash screen lifecycle
  usePreventHideSplashScreen();
  const hideSplashScreenCallback = useHideSplashScreenCallback();
  return (
    <View style={styles.container}>
      <WebView
        ref={webRef}
        style={styles.webview}
        allowSystemKeyEvents
        allowsDefaultMediaControl
        domStorageEnabled
        hasTVPreferredFocus
        javaScriptEnabled
        allowJavaScriptInBackground
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="compatibility"
        // thirdPartyCookiesEnabled
        // userAgent={''}
        source={{
          // headers: {},
          uri: "https://anthonyhinson3rd-beep.github.io/home-dashboard/?key=HD-8f4kQ29vM7xP2L6cN5sW",
        }}
        onLoad={(_event: WebViewNavigationEvent) => {
          console.info('Page loading completed...');
          // Hide the splash screen
          hideSplashScreenCallback();
        }}
        onLoadStart={(_event: WebViewNavigationEvent) => {
          console.info('Page loading started...');
        }}
        onError={({
          nativeEvent: {code, url, description},
        }: WebViewErrorEvent) => {
          console.error(`[onError]: (${code}: ${url}) ${description}`);
          reloadDashboard();
        }}
        onHttpError={({
          nativeEvent: {url, statusCode: code, description, isMainFrame},
        }: WebViewHttpErrorEvent) => {
          console.error(
            `[onHttpError]: ${code}: ${url}: ${description}: isMainFrame=${isMainFrame}`,
          );

          if (isMainFrame) {
            reloadDashboard();
          }
        }}
        onSslError={({code, url, description}: SslErrorData) => {
          console.error(`[onSslError]: ${code}: ${url}: ${description}`);
          reloadDashboard();
        }}
      />
    </View>
  );
};

// Styles for layout, which are necessary for proper focus behavior
const styles = StyleSheet.create({
  container: {flex: 1},
  webview: {backgroundColor: '#000000'},
});
