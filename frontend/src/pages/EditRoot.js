import React, { useState } from "react";
import { Redirect, useLocation, useHistory } from "react-router-dom";
import { getRootByIdQuery, updateRootMutation } from "../queries/queries";
import { Button, Input, Label, Grid, Header, Message } from "semantic-ui-react";
import * as Yup from "yup";
import { Formik, Form } from "formik";
import { useAuth } from "../context/auth";
import { useQuery } from "@apollo/react-hooks";
import { handleErrors, broadCastSuccess } from "../utils/messages";
import { confirmAlert } from "react-confirm-alert";
import "../stylesheets/react-confirm-alert.css";

let updateRootSchema = Yup.object().shape({
  nicodemus: Yup.string().required("a Nicodemus spelling is required"),
  english: Yup.string().required("an English gloss is required"),
  editnote: Yup.string().required("an edit note is required"),
  root: Yup.string().required("a root is required"),
});

function EditRoot() {
  const { client } = useAuth();
  const [hasUpdated, setHasUpdated] = useState(false);
  const search = new URLSearchParams(useLocation().search);
  //console.log(search.get("id"))
  const id = search.get("id");
  const history = useHistory();

  let {
    loading: rootLoading,
    error: rootError,
    data: rootData,
  } = useQuery(getRootByIdQuery, { client: client, variables: { id: id } });

  if (rootLoading) {
    return <div>loading...</div>;
  }
  if (rootError) {
    return <div>Something went wrong</div>;
  }

  async function onFormSubmit(values, setSubmitting) {
    try {
      const result = await client.mutate({
        mutation: updateRootMutation,
        variables: {
          id: values.id,
          root: values.root,
          nicodemus: values.nicodemus,
          english: values.english,
          salish: values.salish,
          cognate: values.cognate,
          editnote: values.editnote,
          number: values.number ? parseInt(values.number) : null,
          sense: values.sense,
          crossref: values.crossref,
          grammar: values.grammar,
          variant: values.variant,
          symbol: values.symbol,
        },
      });
      if (result.error) {
        handleErrors(result.error);
        setSubmitting(false);
      } else {
        broadCastSuccess(`root ${values.root} successfully edited!`);
        setSubmitting(false);
        setHasUpdated(true);
      }
    } catch (error) {
      handleErrors(error);
      setSubmitting(false);
    }
  }

  if (hasUpdated) {
    return <Redirect to="/roots" />;
  }

  //   function dropDownOptions(options) {
  //       let res = []
  //       options.map((item) => {
  //           let h = {}
  //           h = {
  //               key: item.id.toString(),
  //               value: item.id.toString(),
  //               text: item.value
  //           }
  //           res.push(h)
  //       })
  //       return res
  //   }

  const routeChange = () => {
    let path = `/roots`;
    history.push(path);
  };

  return (
    <>
      <Grid centered>
        <Grid.Row>
          <Grid.Column textAlign="center" width={12}>
            <Header as="h2">Edit a Root</Header>
            <Message>
              The elements whose labels are solid blue are required for all
              roots. The elements whose labels are outlined may be blank.
            </Message>
          </Grid.Column>
        </Grid.Row>
      </Grid>
      <Formik
        initialValues={{
          id: rootData.roots_by_pk.id,
          root: rootData.roots_by_pk.root,
          number:
            rootData.roots_by_pk.number &&
            rootData.roots_by_pk.number.toString()
              ? rootData.roots_by_pk.number.toString()
              : "",
          sense: rootData.roots_by_pk.sense ? rootData.roots_by_pk.sense : "",
          nicodemus: rootData.roots_by_pk.nicodemus,
          salish: rootData.roots_by_pk.salish
            ? rootData.roots_by_pk.salish
            : "",
          english: rootData.roots_by_pk.english,
          cognate: rootData.roots_by_pk.cognate
            ? rootData.roots_by_pk.salish
            : "",
          grammar: rootData.roots_by_pk.grammar
            ? rootData.roots_by_pk.grammar
            : "",
          symbol: rootData.roots_by_pk.symbol
            ? rootData.roots_by_pk.symbol
            : "",
          variant: rootData.roots_by_pk.variant
            ? rootData.roots_by_pk.variant
            : "",
          crossref: rootData.roots_by_pk.crossref
            ? rootData.roots_by_pk.crossref
            : "",
          editnote: rootData.roots_by_pk.editnote
            ? rootData.roots_by_pk.editnote
            : "",
        }}
        validationSchema={updateRootSchema}
        onSubmit={(values, { setSubmitting }) => {
          confirmAlert({
            title: "Confirm to submit",
            message: "Are you sure you want to edit the root?",
            buttons: [
              {
                label: "Yes",
                onClick: () => onFormSubmit(values, setSubmitting),
              },
              {
                label: "No",
                onClick: () => setSubmitting(false),
              },
            ],
          });
        }}
      >
        {({
          isSubmitting,
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          setFieldValue,
        }) => (
          <Form>
            <Grid centered>
              <Grid.Row>
                <Grid.Column width={2} textAlign="right">
                  <Label pointing="right" color="blue">
                    Root
                  </Label>
                </Grid.Column>
                <Grid.Column width={10}>
                  <Input
                    fluid
                    style={{ paddingBottom: "5px" }}
                    id="root"
                    placeholder="Root"
                    type="text"
                    value={values.root}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={
                      errors.root && touched.root
                        ? "text-input error"
                        : "text-input"
                    }
                  />
                  {errors.root && touched.root && (
                    <div className="input-feedback">{errors.root}</div>
                  )}
                </Grid.Column>
              </Grid.Row>
              <Grid.Row>
                <Grid.Column width={2} textAlign="right">
                  <Label pointing="right" basic color="blue">
                    Number
                  </Label>
                </Grid.Column>
                <Grid.Column width={10}>
                  <Input
                    fluid
                    style={{ paddingBottom: "5px" }}
                    id="number"
                    placeholder="Number"
                    type="text"
                    value={values.number}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={
                      errors.number && touched.number
                        ? "text-input error"
                        : "text-input"
                    }
                  />
                  {errors.number && touched.number && (
                    <div className="input-feedback">{errors.number}</div>
                  )}
                </Grid.Column>
              </Grid.Row>
              <Grid.Row>
                <Grid.Column width={2} textAlign="right">
                  <Label pointing="right" basic color="blue">
                    Sense
                  </Label>
                </Grid.Column>
                <Grid.Column width={10}>
                  <Input
                    fluid
                    style={{ paddingBottom: "5px" }}
                    id="salish"
                    placeholder="Sense"
                    type="text"
                    value={values.sense}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={
                      errors.sense && touched.sense
                        ? "text-input error"
                        : "text-input"
                    }
                  />
                  {errors.sense && touched.sense && (
                    <div className="input-feedback">{errors.sense}</div>
                  )}
                </Grid.Column>
              </Grid.Row>
              <Grid.Row>
                <Grid.Column width={2} textAlign="right">
                  <Label pointing="right" color="blue">
                    Nicodemus
                  </Label>
                </Grid.Column>
                <Grid.Column width={10}>
                  <Input
                    fluid
                    style={{ paddingBottom: "5px" }}
                    id="nicodemus"
                    placeholder="Nicodemus"
                    type="text"
                    value={values.nicodemus}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={
                      errors.nicodemus && touched.nicodemus
                        ? "text-input error"
                        : "text-input"
                    }
                  />
                  {errors.nicodemus && touched.nicodemus && (
                    <div className="input-feedback">{errors.nicodemus}</div>
                  )}
                </Grid.Column>
              </Grid.Row>
              <Grid.Row>
                <Grid.Column width={2} textAlign="right">
                  <Label pointing="right" basic color="blue">
                    Salish
                  </Label>
                </Grid.Column>
                <Grid.Column width={10}>
                  <Input
                    fluid
                    style={{ paddingBottom: "5px" }}
                    id="salish"
                    placeholder="Salish"
                    type="text"
                    value={values.salish}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={
                      errors.salish && touched.salish
                        ? "text-input error"
                        : "text-input"
                    }
                  />
                  {errors.salish && touched.salish && (
                    <div className="input-feedback">{errors.salish}</div>
                  )}
                </Grid.Column>
              </Grid.Row>
              <Grid.Row>
                <Grid.Column width={2} textAlign="right">
                  <Label pointing="right" color="blue">
                    English
                  </Label>
                </Grid.Column>
                <Grid.Column width={10}>
                  <Input
                    fluid
                    style={{ paddingBottom: "5px" }}
                    id="english"
                    placeholder="english"
                    type="text"
                    value={values.english}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={
                      errors.english && touched.english
                        ? "text-input error"
                        : "text-input"
                    }
                  />
                  {errors.english && touched.english && (
                    <div className="input-feedback">{errors.english}</div>
                  )}
                </Grid.Column>
              </Grid.Row>
              <Grid.Row>
                <Grid.Column width={2} textAlign="right">
                  <Label pointing="right" basic color="blue">
                    Symbol
                  </Label>
                </Grid.Column>
                <Grid.Column width={10}>
                  <Input
                    fluid
                    style={{ paddingBottom: "5px" }}
                    id="symbol"
                    placeholder="Symbol"
                    type="text"
                    value={values.symbol}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={
                      errors.symbol && touched.symbol
                        ? "text-input error"
                        : "text-input"
                    }
                  />
                  {errors.symbol && touched.symbol && (
                    <div className="input-feedback">{errors.symbol}</div>
                  )}
                </Grid.Column>
              </Grid.Row>
              <Grid.Row>
                <Grid.Column width={2} textAlign="right">
                  <Label pointing="right" basic color="blue">
                    Grammar
                  </Label>
                </Grid.Column>
                <Grid.Column width={10}>
                  <Input
                    fluid
                    style={{ paddingBottom: "5px" }}
                    id="grammar"
                    placeholder="Grammar"
                    type="text"
                    value={values.grammar}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={
                      errors.grammar && touched.grammar
                        ? "text-input error"
                        : "text-input"
                    }
                  />
                  {errors.grammar && touched.grammar && (
                    <div className="input-feedback">{errors.grammar}</div>
                  )}
                </Grid.Column>
              </Grid.Row>
              <Grid.Row>
                <Grid.Column width={2} textAlign="right">
                  <Label pointing="right" basic color="blue">
                    Variant
                  </Label>
                </Grid.Column>
                <Grid.Column width={10}>
                  <Input
                    fluid
                    style={{ paddingBottom: "5px" }}
                    id="variant"
                    placeholder="Variant"
                    type="text"
                    value={values.variant}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={
                      errors.variant && touched.variant
                        ? "text-input error"
                        : "text-input"
                    }
                  />
                  {errors.variant && touched.variant && (
                    <div className="input-feedback">{errors.variant}</div>
                  )}
                </Grid.Column>
              </Grid.Row>
              <Grid.Row>
                <Grid.Column width={2} textAlign="right">
                  <Label pointing="right" basic color="blue">
                    Cross-Reference
                  </Label>
                </Grid.Column>
                <Grid.Column width={10}>
                  <Input
                    fluid
                    style={{ paddingBottom: "5px" }}
                    id="crossref"
                    placeholder="Cross-reference"
                    type="text"
                    value={values.crossref}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={
                      errors.crossref && touched.crossref
                        ? "text-input error"
                        : "text-input"
                    }
                  />
                  {errors.crossref && touched.crossref && (
                    <div className="input-feedback">{errors.crossref}</div>
                  )}
                </Grid.Column>
              </Grid.Row>
              <Grid.Row>
                <Grid.Column width={2} textAlign="right">
                  <Label basic pointing="right" color="blue">
                    Cognate
                  </Label>
                </Grid.Column>
                <Grid.Column width={10}>
                  <Input
                    fluid
                    style={{ paddingBottom: "5px" }}
                    id="cognate"
                    placeholder="cognate"
                    type="text"
                    value={values.cognate}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={
                      errors.cognate && touched.cognate
                        ? "text-input error"
                        : "text-input"
                    }
                  />
                  {errors.link && touched.link && (
                    <div className="input-feedback">{errors.link}</div>
                  )}
                </Grid.Column>
              </Grid.Row>
              <Grid.Row>
                <Grid.Column width={2} textAlign="right">
                  <Label pointing="right" color="blue">
                    Edit Note
                  </Label>
                </Grid.Column>
                <Grid.Column width={10}>
                  <Input
                    fluid
                    style={{ paddingBottom: "5px" }}
                    id="editnote"
                    placeholder="An edit note is required"
                    type="text"
                    value={values.editnote}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={
                      errors.editnote && touched.editnote
                        ? "text-input error"
                        : "text-input"
                    }
                  />
                  {errors.editnote && touched.editnote && (
                    <div className="input-feedback">{errors.editnote}</div>
                  )}
                </Grid.Column>
              </Grid.Row>
              <Grid.Row>
                <Grid.Column width={4}>
                  <Button
                    fluid
                    color="blue"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    Submit
                  </Button>
                </Grid.Column>
                <Grid.Column width={4}>
                  <Button onClick={routeChange} fluid>
                    Cancel
                  </Button>
                </Grid.Column>
              </Grid.Row>
            </Grid>
          </Form>
        )}
      </Formik>
    </>
  );
}

export default EditRoot;
