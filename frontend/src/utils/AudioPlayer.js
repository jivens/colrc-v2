import React, { Component } from "react";

class AudioPlayer extends Component {
  createAudioSources = (sources) => {
    let children = [];
    console.log("the sources are ", sources);
    //Inner loop to create children
    let directLink = "";
    for (let i = 0; i < sources.length; i++) {
      children.push(
        <source
          src={sources[i].audio_with_path}
          type={sources[i].type}
          key={sources[i].key}
        ></source>
      );
      if (sources[i].direct) {
        directLink = <a href={sources[i].audio_with_path}>Access the files</a>;
      }
    }
    if (directLink !== "") {
      children.push(
        <p>
          Your browser does not support the HTML5 audio element. {directLink}{" "}
          directly.
        </p>
      );
    }
    return children;
  };

  render() {
    // const hasTitle = this.props.title.length > 0;
    // const hasSpeaker = this.props.speaker ? true : false;
    // const hasLanguage = this.props.language ? true: false;
    // const conditionalTitle = hasTitle ? this.props.title : '';
    // const title = hasSpeaker && hasTitle
    //   ? <p>{this.props.title}, spoken by {this.props.speaker}</p>
    //   : (hasTitle
    //     ? <p>{this.props.title}</p>
    //     : '')

    return (
      <div key={this.props.id}>
        <audio controls="controls" preload="none">
          {this.createAudioSources(this.props.sources)}
        </audio>
      </div>
    );
  }
}

export default AudioPlayer;
