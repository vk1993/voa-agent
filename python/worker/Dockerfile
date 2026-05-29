FROM public.ecr.aws/lambda/python:3.12

# Copy core
COPY core ${LAMBDA_TASK_ROOT}/core
RUN pip install -e ${LAMBDA_TASK_ROOT}/core

# Copy worker
COPY . ${LAMBDA_TASK_ROOT}/worker
RUN pip install -e ${LAMBDA_TASK_ROOT}/worker

# Set the CMD to your handler (could be post_call.handler or fine_tuning.handler)
CMD [ "post_call.handler" ]
