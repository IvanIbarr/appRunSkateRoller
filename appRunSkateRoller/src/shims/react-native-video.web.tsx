import React from 'react';
import {View, Text} from 'react-native';

type Props = {
  source?: any;
  style?: any;
  resizeMode?: any;
  paused?: boolean;
  repeat?: boolean;
  controls?: boolean;
  onError?: (e: any) => void;
  onLoad?: (e: any) => void;
  onEnd?: () => void;
};

const Video: React.FC<Props> = () => {
  return (
    <View style={{padding: 12}}>
      <Text style={{color: '#666'}}>
        Video no disponible en Web.
      </Text>
    </View>
  );
};

export default Video;

